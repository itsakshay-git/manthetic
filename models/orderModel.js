const prisma = require('../db/prisma');

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
      throw buildHttpError("Address not found", 404);
    }

    const cartItems = await tx.cartItem.findMany({
      where: { userId: parsedUserId }
    });

    if (cartItems.length === 0) {
      throw buildHttpError("Cart is empty", 400);
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
        throw buildHttpError("Invalid size/variant", 400);
      }

      const price = parseFloat(matchingSize.price);
      const stock = parseInt(matchingSize.stock);
      const quantity = parseInt(item.quantity);

      if (stock < quantity) {
        throw buildHttpError("Insufficient stock", 400);
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
          price
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

exports.addOrderItem = async (orderId, productId, variantId, quantity, price) => {
  const result = await prisma.orderItem.create({
    data: {
      orderId: parseInt(orderId),
      productId: parseInt(productId),
      variantId: parseInt(variantId),
      quantity: parseInt(quantity),
      price: parseFloat(price)
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

  // Transform to match expected format
  const transformedOrders = orders.map(order => ({
    ...order,
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

  // Get customer names for all orders
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

  // Create a map for quick customer lookup
  const customerMap = customers.reduce((map, customer) => {
    map[customer.id] = customer.name;
    return map;
  }, {});

  // Transform to match expected format
  const transformedOrders = orders.map(order => ({
    id: order.id,
    customer_id: order.customerId,
    customer_name: customerMap[order.customerId] || 'Unknown Customer',
    status: order.status,
    payment_status: order.paymentStatus,
    total_amount: order.totalAmount,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    items: order.orderItems.map(item => ({
      id: item.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product?.title
    }))
  }));

  return { rows: transformedOrders };
};

exports.updateOrderStatus = async (status, paymentStatus, orderId) => {
  const result = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status,
      paymentStatus,
      updatedAt: new Date()
    }
  });
  return { rows: [result] };
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

  // Transform to match expected format
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
    items: order.orderItems.map(item => ({
      id: item.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      price: item.price,
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

  // Transform to match expected format
  const transformedOrders = orders.map(order => ({
    id: order.id,
    customer_id: order.customerId,
    status: order.status,
    payment_status: order.paymentStatus,
    total_amount: order.totalAmount,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    items: order.orderItems.map((item) => {
      const sizeOptions = Array.isArray(item.product_variants?.sizeOptions)
        ? item.product_variants.sizeOptions
        : [];
      const firstSizeOption = sizeOptions[0] || {};

      return {
        id: item.id,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: firstSizeOption.price || item.price,
        size: firstSizeOption.size,
        product_name: item.product?.title,
        variant_name: item.product_variants?.name,
        images: item.product_variants?.images || []
      };
    })
  }));

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

  // Transform to match expected format and add review info
  const transformedOrders = await Promise.all(orders.map(async (order) => {
    const items = await Promise.all(order.orderItems.map(async (item) => {
      const sizeOptions = Array.isArray(item.product_variants?.sizeOptions)
        ? item.product_variants.sizeOptions
        : [];
      const firstSizeOption = sizeOptions[0] || {};

      // Check if reviewed
      const review = await prisma.review.findFirst({
        where: {
          userId: parseInt(userId),
          productVariantId: item.variantId
        }
      });

      return {
        id: item.id,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        price: firstSizeOption.price || item.price,
        size: firstSizeOption.size,
        product_name: item.product?.title,
        variant_name: item.product_variants?.name,
        images: item.product_variants?.images || [],
        reviewed: !!review
      };
    }));

    return {
      id: order.id,
      customer_id: order.customerId,
      status: order.status,
      payment_status: order.paymentStatus,
      total_amount: order.totalAmount,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
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
