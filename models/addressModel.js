const prisma = require('../db/prisma');

const createAddress = async (user_id, city, zipcode, country, state, street, phone) => {
  const result = await prisma.address.create({
    data: {
      userId: parseInt(user_id),
      city,
      zipcode,
      country,
      state,
      street,
      phone
    }
  });
  return result;
};

const findAddressesByUserId = async (user_id) => {
  const result = await prisma.address.findMany({
    where: { userId: parseInt(user_id) },
    orderBy: { id: 'desc' }
  });
  return result;
};

const findAddressById = async (id) => {
  const result = await prisma.address.findUnique({
    where: { id: parseInt(id) }
  });
  return result;
};

const removeAddress = async (id) => {
  await prisma.address.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  createAddress,
  findAddressesByUserId,
  findAddressById,
  removeAddress
};
