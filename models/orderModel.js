const prisma = require('../db/prisma');

const CANCELLABLE_STATUSES = new Set(['PENDING', 'CONFIRMED']);
const TERMINAL_STATUSES = new Set(['SHIPPED', 'DELIVERED', 'CANCELLED']);
const CANCEL_WINDOW_HOURS = 24;
const CANCEL_WINDOW_MS = CANCEL_WINDOW_HOURS * 60 * 60 * 1000;

const buildHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getSizeOption = (variant, size) => {
  if (!variant || !size) {
    return null;
  }

  const sizeOptions = Array.isArray(variant?.sizeOptions) ? variant.sizeOptions : [];
  return sizeOptions.find(option =>
    option.size && option.size.toLowerCase().trim() === size.toLowerCase().trim()
  );
};

const getCancelUntil = (createdAt) => {
  if (!createdAt) return null;
  return new Date(new Date(createdAt).getTime() + CANCEL_WINDOW_MS);
};

const getCancelMeta = (order) => {
  const status = order?.status || 'PENDING';
  const cancelUntil = getCancelUntil(order?.createdAt);
  const now = Date.now();

  if (status === 'CANCELLED') {
    return {
      canCancel: false,
      cancelUntil,
      cancelUnavailableReason: 'Order cancelled'
    };
  }

  if (status === 'SHIPPED') {
    return {
      canCancel: false,
      cancelUntil,
      cancelUnavailableReason: 'Already shipped'
    };
  }

  if (status === 'DELIVERED') {
    return {
      canCancel: false,
      cancelUntil,
      cancelUnavailableReason: 'Already delivered'
    };
  }

  if (!CANCELLABLE_STATUSES.has(status)) {
    return {
      canCancel: false,
      cancelUntil,
      cancelUnavailableReason: 'Cancellation unavailable'
    };
  }

  if (!cancelUntil || now >= cancelUntil.getTime()) {
    return {
      canCancel: false,
      cancelUntil,
      cancelUnavailableReason: 'Cancellation closed'
    };
  }

  return {
    canCancel: true,
    cancelUntil,
    cancelUnavailableReason: null
  };
};

const restoreOrderStock = async (tx, orderItems) => {
  for (const item of orderItems) {
    if (!item.variantId || !item.selectedSize) {
      throw buildHttpError('This order cannot be cancelled automatically because item size was not stored.', 409);
    }

    const variant = await tx.productVariant.findUnique({
      where: { id: parseInt(item.variantId) },
      select: { sizeOptions: true }
    });

    if (!variant || !Array.isArray(variant.sizeOptions)) {
      throw buildHttpError('Variant stock data not found for cancellation.', 409);
    }

    let matchedSize = false;
    const updatedSizeOptions = variant.sizeOptions.map(option => {
      if (option.size && option.size.toLowerCase().trim() === item.selectedSize.toLowerCase().trim()) {
        matchedSize = true;
        return {
          ...option,
          stock: parseInt(option.stock || 0) + parseInt(item.quantity || 0)
        };
      }
      return option;
    });

    if (!matchedSize) {
      throw buildHttpError(`Size ${item.selectedSize} no longer exists for a cancelled item.`, 409);
    }

    await tx.productVariant.update({
      where: { id: parseInt(item.variantId) },
      data: { sizeOptions: updatedSizeOptions }
    });
  }
};

const transformOrderItem = (item) => {
  const sizeOptions = Array.isArray(item.product_variants?.sizeOptions)
    ? item.product_variants.sizeOptions
    : [];
  const selectedOption = getSizeOption(item.product_variants, item.selectedSize) || sizeOptions[0] || {};

  return {
    id: item.id,
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
    price: selectedOption.price || item.price,
    size: item.selectedSize || selectedOption.size,
    product_name: item.product?.title,
    variant_name: item.product_variants?.name,
    images: item.product_variants?.images || []
  };
};

const transformUserOrder = (order) => ({
  id: order.id,
  customer_id: order.customerId,
  status: order.status,
  payment_status: order.paymentStatus,
  total_amount: order.totalAmount,
  created_at: order.createdAt,
  updated_at: order.updatedAt,
  cancelled_at: order.cancelledAt,
  cancelled_by: order.cancelledBy,
  ...getCancelMeta(order),
  items: order.orderItems.map(transformOrderItem)
});

exports.placeOrder = async (userId, addressId, paymentMethod) => {
  return prisma.$transaction(async (tx) => {
    const parsedUserId = parseInt(userId);
    const parsedAddressId = parseInt(addressId);

    const address = await tx.address.findFirst({
      where: {
        id: parsedAddressId,
        userId: parsedUserId
      }
    });

    if (!address) {
      throw buildHttpError('Address not found', 404);
    }

    const cartItems = await tx.cartItem.findMany({
      where: { userId: parsedUserId }
    });

    if (cartItems.length === 0) {
      throw buildHttpError('Cart is empty', 400);
    }

    const order = await tx.order.create({
      data: {
        customerId: parsedUserId,
        totalAmount: 0,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        addressId: parsedAddressId,
        paymentMethod
      }
    });

    let totalAmount = 0;

    for (const item of cartItems) {
      const variant = await tx.productVariant.findUnique({
        where: { id: parseInt(item.variantId) },
        select: {
          sizeOptions: true,
          productId: true
        }
      });

      const matchingSize = getSizeOption(variant, item.selectedSize);
      if (!matchingSize) {
        throw buildHttpError('Invalid size/variant', 400);
      }

      const price = parseFloat(matchingSize.price);
      const stock = parseInt(matchingSize.stock);
      const quantity = parseInt(item.quantity);

      if (stock < quantity) {
        throw buildHttpError('Insufficient stock', 400);
      }

      totalAmount += price * quantity;

      const updatedSizeOptions = variant.sizeOptions.map(option => {
        if (option.size && option.size.toLowerCase().trim() === item.selectedSize.toLowerCase().trim()) {
          return {
            ...option,
            stock: stock - quantity
          };
        }
        return option;
      });

      await tx.productVariant.update({
        where: { id: parseInt(item.variantId) },
        data: { sizeOptions: updatedSizeOptions }
      });

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: parseInt(variant.productId),
          variantId: parseInt(item.variantId),
          quantity,
          price,
          selectedSize: item.selectedSize
        }
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { totalAmount }
    });

    await tx.cartItem.deleteMany({
      where: { userId: parsedUserId }
    });

    return updatedOrder;
  });
};

exports.getCartItemsByUserId = async (userId) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: parseInt(userId) }
  });
  return { rows: cartItems };
};

exports.getVariantDetails = async (variantId) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
    select: {
      productId: true,
      sizeOptions: true
    }
  });
  return { rows: [variant] };
};

exports.getVariantPriceAndStockBySize = async (variantId, size) => {
  if (!variantId) {
    console.error('variantId is missing or undefined');
    return { rows: [] };
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
    select: {
      sizeOptions: true,
      productId: true
    }
  });

  if (!variant || !variant.sizeOptions) {
    return { rows: [] };
  }

  const sizeOptions = Array.isArray(variant.sizeOptions) ? variant.sizeOptions : [];
  const matchingSize = sizeOptions.find(option =>
    option.size && option.size.toLowerCase().trim() === size.toLowerCase().trim()
  );

  if (matchingSize) {
    return {
      rows: [{
        price: parseFloat(matchingSize.price),
        stock: parseInt(matchingSize.stock),
        product_id: variant.productId
      }]
    };
  }

  return { rows: [] };
};

exports.updateOrderTotal = async (orderId, totalAmount) => {
  const result = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { totalAmount: parseFloat(totalAmount) }
  });
  return { rows: [result] };
};

exports.reduceStock = async (variantId, size, quantity) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variantId) },
    select: { sizeOptions: true }
  });

  if (!variant || !variant.sizeOptions) {
    throw new Error('Variant not found or no size options');
  }

  const sizeOptions = Array.isArray(variant.sizeOptions) ? variant.sizeOptions : [];
  const updatedSizeOptions = sizeOptions.map(option => {
    if (option.size && option.size.toLowerCase().trim() === size.toLowerCase().trim()) {
      return {
        ...option,
        stock: Math.max(0, parseInt(option.stock) - parseInt(quantity))
      };
    }
    return option;
  });

  await prisma.productVariant.update({
    where: { id: parseInt(variantId) },
    data: { sizeOptions: updatedSizeOptions }
  });
};

exports.createOrder = async (customerId, totalAmount, addressId, paymentMethod) => {
  const result = await prisma.order.create({
    data: {
      customerId: parseInt(customerId),
      totalAmount: parseFloat(totalAmount),
      status: 'PENDING',
      paymentStatus: 'PENDING',
      addressId: parseInt(addressId),
      paymentMethod
    }
  });
  return { rows: [result] };
};

exports.addOrderItem = async (orderId, productId, variantId, quantity, price, selectedSize) => {
  const result = await prisma.orderItem.create({
    data: {
      orderId: parseInt(orderId),
      productId: parseInt(productId),
      variantId: parseInt(variantId),
      quantity: parseInt(quantity),
      price: parseFloat(price),
      selectedSize
    }
  });
  return { rows: [result] };
};

exports.clearCart = async (userId) => {
  await prisma.cartItem.deleteMany({
    where: { userId: parseInt(userId) }
  });
  return { rows: [] };
};

exports.getUserOrders = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { customerId: parseInt(userId) },
    include: {
      orderItems: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const transformedOrders = orders.map(order => ({
    ...order,
    ...getCancelMeta(order),
    items: order.orderItems
  }));

  return { rows: transformedOrders };
};

exports.getAllOrders = async () => {
  const orders = await prisma.order.findMany({
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              title: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const customerIds = [...new Set(orders.map(order => order.customerId).filter(Boolean))];
  const customers = await prisma.user.findMany({
    where: {
      id: { in: customerIds }
    },
    select: {
      id: true,
      name: true
    }
  });

  const customerMap = customers.reduce((map, customer) => {
    map[customer.id] = customer.name;
    return map;
  }, {});

  const transformedOrders = orders.map(order => ({
    id: order.id,
    customer_id: order.customerId,
    customer_name: customerMap[order.customerId] || 'Unknown Customer',
    status: order.status,
    payment_status: order.paymentStatus,
    total_amount: order.totalAmount,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    cancelled_at: order.cancelledAt,
    cancelled_by: order.cancelledBy,
    items: order.orderItems.map(item => ({
      id: item.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
      size: item.selectedSize,
      product_name: item.product?.title
    }))
  }));

  return { rows: transformedOrders };
};

exports.updateOrderStatus = async (status, paymentStatus, orderId) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { orderItems: true }
    });

    if (!order) {
      return { rows: [] };
    }

    if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
      throw buildHttpError('Cancelled orders cannot be moved back to active statuses', 409);
    }

    const data = {
      status,
      updatedAt: new Date()
    };

    if (paymentStatus) {
      data.paymentStatus = paymentStatus;
    }

    if (status === 'CANCELLED') {
      if (order.status !== 'CANCELLED') {
        await restoreOrderStock(tx, order.orderItems);
      }
      data.paymentStatus = 'FAILED';
      data.cancelledAt = order.cancelledAt || new Date();
      data.cancelledBy = order.cancelledBy || 'ADMIN';
    }

    const result = await tx.order.update({
      where: { id: parseInt(orderId) },
      data
    });

    return { rows: [result] };
  });
};

exports.cancelOrderByCustomer = async (orderId, userId) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        orderItems: {
          include: {
            product: {
              select: { title: true }
            },
            product_variants: {
              select: {
                name: true,
                images: true,
                sizeOptions: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw buildHttpError('Order not found', 404);
    }

    if (order.customerId !== parseInt(userId)) {
      throw buildHttpError('Access denied', 403);
    }

    const cancelMeta = getCancelMeta(order);
    if (!cancelMeta.canCancel) {
      throw buildHttpError(cancelMeta.cancelUnavailableReason || 'Order cannot be cancelled', 409);
    }

    await restoreOrderStock(tx, order.orderItems);

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'FAILED',
        cancelledAt: new Date(),
        cancelledBy: 'CUSTOMER',
        updatedAt: new Date()
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: { title: true }
            },
            product_variants: {
              select: {
                name: true,
                images: true,
                sizeOptions: true
              }
            }
          }
        }
      }
    });

    return transformUserOrder(updatedOrder);
  });
};

exports.getOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    return { rows: [] };
  }

  const transformedOrder = {
    id: order.id,
    customer_id: order.customerId,
    status: order.status,
    payment_status: order.paymentStatus,
    total_amount: order.totalAmount,
    address_id: order.addressId,
    payment_method: order.paymentMethod,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    cancelled_at: order.cancelledAt,
    cancelled_by: order.cancelledBy,
    ...getCancelMeta(order),
    items: order.orderItems.map(item => ({
      id: item.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
      size: item.selectedSize,
      product_name: item.product?.title
    }))
  };

  return { rows: [transformedOrder] };
};

exports.getOrdersByUserIdAdmin = async (userId, limit, offset) => {
  const orders = await prisma.order.findMany({
    where: { customerId: parseInt(userId) },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              title: true
            }
          },
          product_variants: {
            select: {
              name: true,
              images: true,
              sizeOptions: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: parseInt(limit),
    skip: parseInt(offset)
  });

  const transformedOrders = orders.map(transformUserOrder);

  return { rows: transformedOrders };
};

exports.getOrdersCountByUserId = async (userId) => {
  const count = await prisma.order.count({
    where: { customerId: parseInt(userId) }
  });
  return { rows: [{ count: count.toString() }] };
};

exports.getDeliveredOrdersByUserId = async (userId, limit, offset) => {
  const orders = await prisma.order.findMany({
    where: {
      customerId: parseInt(userId),
      status: 'DELIVERED'
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              title: true
            }
          },
          product_variants: {
            select: {
              name: true,
              images: true,
              sizeOptions: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: parseInt(limit),
    skip: parseInt(offset)
  });

  const transformedOrders = await Promise.all(orders.map(async (order) => {
    const baseOrder = transformUserOrder(order);
    const items = await Promise.all(order.orderItems.map(async (item) => {
      const transformedItem = transformOrderItem(item);

      const review = await prisma.review.findFirst({
        where: {
          userId: parseInt(userId),
          productVariantId: item.variantId
        }
      });

      return {
        ...transformedItem,
        reviewed: !!review
      };
    }));

    return {
      ...baseOrder,
      items
    };
  }));

  return { rows: transformedOrders };
};

exports.getDeliveredOrdersCountByUserId = async (userId) => {
  const count = await prisma.order.count({
    where: {
      customerId: parseInt(userId),
      status: 'DELIVERED'
    }
  });
  return { rows: [{ count: count.toString() }] };
};
