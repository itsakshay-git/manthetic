const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllCustomers = async () => {
  const result = await prisma.user.findMany({
    where: { role: 'CUSTOMER' }
  });
  return result;
};

const deleteCustomerById = async (id) => {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete cart items first
      await tx.cartItem.deleteMany({
        where: { userId: parseInt(id) }
      });

      // Delete orders
      await tx.order.deleteMany({
        where: { customerId: parseInt(id) }
      });

      // Delete the user
      await tx.user.delete({
        where: { id: parseInt(id) }
      });
    });

    // Return the deleted user info (we can't return it from transaction)
    return { id: parseInt(id), message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
};

const findUserByEmail = async (email) => {
  console.log(email);
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
  deleteCustomerById,
  findUserByEmail,
  createUser,
  getUserById,
  updateUserRole,
  updateUserPassword
};
