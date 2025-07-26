const jwt = require('jsonwebtoken');
const pool = require('../db');

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return res.status(401).json({ msg: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [decoded.id]);

    if (!result.rows.length) return res.status(401).json({ msg: 'User not found' });

    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Not authorized' });
  }
};
