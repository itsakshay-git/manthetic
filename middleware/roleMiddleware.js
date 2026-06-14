exports.isAdmin = async (req, res, next) => {
  const prisma = require('../db/prisma');
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.user.id) },
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ msg: 'Access denied. Admins only.' });
  }

  next();
};
