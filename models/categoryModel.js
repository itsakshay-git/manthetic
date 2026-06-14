const prisma = require('../db/prisma');

exports.getAll = async () => {
  const result = await prisma.category.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });
  return result;
};

exports.getById = async (id) => {
  const result = await prisma.category.findUnique({
    where: { id: parseInt(id) }
  });
  return result;
};

exports.create = async (name, description, imageUrl = null) => {
  const result = await prisma.category.create({
    data: {
      name,
      description,
      image: imageUrl
    }
  });
  return result;
};

exports.update = async (id, name, description, imageUrl = null) => {
  const result = await prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      name,
      description,
      image: imageUrl
    }
  });
  return result;
};

exports.delete = async (id) => {
  await prisma.category.delete({
    where: { id: parseInt(id) }
  });
};
