const prisma = require('../db/prisma');

const ABANDONED_CART_DAYS = 3;
const toNumber = (value) => Number(value || 0);

const indexBy = (items, keyName) => items.reduce((map, item) => {
  const key = item[keyName];
  if (key !== null && key !== undefined) {
    map[key] = item;
  }
  return map;
}, {});

const getCartValue = (items) => items.reduce((sum, item) => {
  return sum + toNumber(item.selectedPrice) * toNumber(item.quantity || 1);
}, 0);

const daysSince = (date) => {
  if (!date) return null;
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
};

const getPurchasedVariantSet = async (customerId) => {
  const orders = await prisma.order.findMany({
    where: { customerId: parseInt(customerId) },
    select: {
      orderItems: {
        select: {
          variantId: true,
          productId: true,
        }
      }
    }
  });

  const variants = new Set();
  const products = new Set();
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (item.variantId) variants.add(item.variantId);
      if (item.productId) products.add(item.productId);
    });
  });

  return { variants, products };
};

const getAllCustomers = async () => {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const customerIds = customers.map((customer) => customer.id);
  if (!customerIds.length) return [];

  const [
    orderGroups,
    deliveredOrderGroups,
    pendingOrderGroups,
    cartItems,
    wishlistGroups,
    reviewGroups,
    addressGroups,
    addresses,
    ordersForPurchaseCheck
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds } },
      _count: { _all: true },
      _sum: { totalAmount: true },
      _max: { createdAt: true }
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds }, status: 'DELIVERED' },
      _count: { _all: true }
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds }, status: 'PENDING' },
      _count: { _all: true }
    }),
    prisma.cartItem.findMany({
      where: { userId: { in: customerIds } },
      select: {
        userId: true,
        variantId: true,
        quantity: true,
        selectedPrice: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.wishlistItem.groupBy({
      by: ['userId'],
      where: { userId: { in: customerIds } },
      _count: { _all: true }
    }),
    prisma.review.groupBy({
      by: ['userId'],
      where: { userId: { in: customerIds } },
      _count: { _all: true }
    }),
    prisma.address.groupBy({
      by: ['userId'],
      where: { userId: { in: customerIds } },
      _count: { _all: true }
    }),
    prisma.address.findMany({
      where: { userId: { in: customerIds } },
      orderBy: { id: 'desc' },
      select: {
        userId: true,
        city: true,
        state: true
      }
    }),
    prisma.order.findMany({
      where: { customerId: { in: customerIds } },
      select: {
        customerId: true,
        orderItems: {
          select: { variantId: true }
        }
      }
    })
  ]);

  const ordersByCustomer = indexBy(orderGroups, 'customerId');
  const deliveredByCustomer = indexBy(deliveredOrderGroups, 'customerId');
  const pendingByCustomer = indexBy(pendingOrderGroups, 'customerId');
  const wishlistByCustomer = indexBy(wishlistGroups, 'userId');
  const reviewByCustomer = indexBy(reviewGroups, 'userId');
  const addressByCustomer = indexBy(addressGroups, 'userId');
  const latestAddressByCustomer = addresses.reduce((map, address) => {
    if (address.userId && !map[address.userId]) {
      map[address.userId] = address;
    }
    return map;
  }, {});

  const cartByCustomer = cartItems.reduce((map, item) => {
    if (!item.userId) return map;
    if (!map[item.userId]) map[item.userId] = [];
    map[item.userId].push(item);
    return map;
  }, {});

  const purchasedVariantsByCustomer = ordersForPurchaseCheck.reduce((map, order) => {
    if (!order.customerId) return map;
    if (!map[order.customerId]) map[order.customerId] = new Set();
    order.orderItems.forEach((item) => {
      if (item.variantId) map[order.customerId].add(item.variantId);
    });
    return map;
  }, {});

  return customers.map((customer) => {
    const orderSummary = ordersByCustomer[customer.id];
    const latestAddress = latestAddressByCustomer[customer.id] || {};
    const customerCartItems = cartByCustomer[customer.id] || [];
    const purchasedVariants = purchasedVariantsByCustomer[customer.id] || new Set();
    const oldestCartItemAt = customerCartItems.reduce((oldest, item) => {
      if (!item.createdAt) return oldest;
      if (!oldest || item.createdAt < oldest) return item.createdAt;
      return oldest;
    }, null);
    const latestCartItemAt = customerCartItems.reduce((latest, item) => {
      if (!item.updatedAt) return latest;
      if (!latest || item.updatedAt > latest) return item.updatedAt;
      return latest;
    }, null);
    const notPurchasedCartItems = customerCartItems.filter((item) => item.variantId && !purchasedVariants.has(item.variantId));
    const cartAgeDays = daysSince(oldestCartItemAt);

    return {
      ...customer,
      orderCount: toNumber(orderSummary?._count?._all),
      deliveredOrderCount: toNumber(deliveredByCustomer[customer.id]?._count?._all),
      pendingOrderCount: toNumber(pendingByCustomer[customer.id]?._count?._all),
      totalSpent: toNumber(orderSummary?._sum?.totalAmount),
      lastOrderAt: orderSummary?._max?.createdAt || null,
      cartItemCount: customerCartItems.length,
      wishlistItemCount: toNumber(wishlistByCustomer[customer.id]?._count?._all),
      reviewCount: toNumber(reviewByCustomer[customer.id]?._count?._all),
      addressCount: toNumber(addressByCustomer[customer.id]?._count?._all),
      latestAddressCity: latestAddress.city || null,
      latestAddressState: latestAddress.state || null,
      oldestCartItemAt,
      latestCartItemAt,
      cartIntentValue: getCartValue(customerCartItems),
      hasAbandonedCart: notPurchasedCartItems.length > 0 && cartAgeDays !== null && cartAgeDays >= ABANDONED_CART_DAYS
    };
  });
};

const getCustomerIntentById = async (id) => {
  const customerId = parseInt(id);
  const customer = await prisma.user.findFirst({
    where: { id: customerId, role: 'CUSTOMER' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  if (!customer) return null;

  const [cartItems, wishlistItems, purchased] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId: customerId },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.wishlistItem.findMany({
      where: { userId: customerId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        product_variants: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    getPurchasedVariantSet(customerId)
  ]);

  const cart = cartItems.map((item) => {
    const product = item.variant?.product;
    const isPurchased = item.variantId ? purchased.variants.has(item.variantId) : false;
    const itemValue = toNumber(item.selectedPrice) * toNumber(item.quantity || 1);

    return {
      id: item.id,
      productId: product?.id || null,
      variantId: item.variantId,
      productTitle: product?.title || 'Unknown product',
      variantName: item.variant?.name || 'Unknown variant',
      image: item.variant?.images?.[0] || product?.imageUrl || null,
      selectedSize: item.selectedSize,
      quantity: toNumber(item.quantity),
      selectedPrice: toNumber(item.selectedPrice),
      value: itemValue,
      addedAt: item.createdAt,
      updatedAt: item.updatedAt,
      ageDays: daysSince(item.createdAt),
      isPurchased,
      purchaseStatus: isPurchased ? 'Purchased' : 'Not purchased yet'
    };
  });

  const wishlist = wishlistItems.map((item) => {
    const isPurchased = item.variant_id
      ? purchased.variants.has(item.variant_id)
      : purchased.products.has(item.productId);

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variant_id,
      productTitle: item.product?.title || 'Unknown product',
      variantName: item.product_variants?.name || 'Default variant',
      image: item.product_variants?.images?.[0] || item.product?.imageUrl || null,
      savedAt: item.createdAt,
      ageDays: daysSince(item.createdAt),
      isPurchased,
      purchaseStatus: isPurchased ? 'Purchased' : 'Not purchased yet'
    };
  });

  const oldestCartItemAt = cart.reduce((oldest, item) => {
    if (!item.addedAt) return oldest;
    if (!oldest || item.addedAt < oldest) return item.addedAt;
    return oldest;
  }, null);
  const notPurchasedCartCount = cart.filter((item) => !item.isPurchased).length;
  const notPurchasedWishlistCount = wishlist.filter((item) => !item.isPurchased).length;
  const cartAgeDays = daysSince(oldestCartItemAt);

  return {
    customer,
    totals: {
      cartCount: cart.length,
      wishlistCount: wishlist.length,
      cartValue: getCartValue(cartItems),
      notPurchasedCount: notPurchasedCartCount + notPurchasedWishlistCount,
      oldestCartItemAt,
      hasAbandonedCart: notPurchasedCartCount > 0 && cartAgeDays !== null && cartAgeDays >= ABANDONED_CART_DAYS,
      abandonedThresholdDays: ABANDONED_CART_DAYS
    },
    cart,
    wishlist
  };
};

const deleteCustomerById = async (id) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { userId: parseInt(id) }
      });

      await tx.order.deleteMany({
        where: { customerId: parseInt(id) }
      });

      await tx.user.delete({
        where: { id: parseInt(id) }
      });
    });

    return { id: parseInt(id), message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
};

const findUserByEmail = async (email) => {
  const result = await prisma.user.findUnique({
    where: { email: email }
  });
  return result;
};

const createUser = async (name, email, hashedPassword) => {
  const result = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    }
  });
  return result;
};

const getUserById = async (id) => {
  const result = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  return result;
};

const updateUserRole = async (id, role) => {
  const result = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  return result;
};

const updateUserPassword = async (id, hashedPassword) => {
  const result = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { password: hashedPassword },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  return result;
};

module.exports = {
  getAllCustomers,
  getCustomerIntentById,
  deleteCustomerById,
  findUserByEmail,
  createUser,
  getUserById,
  updateUserRole,
  updateUserPassword
};