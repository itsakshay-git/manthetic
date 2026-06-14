const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');
const { config } = require('../config');

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return res.status(401).json({ msg: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) return res.status(401).json({ msg: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Not authorized' });
  }
};
