exports.isAdmin = async (req, res, next) => {
  const pool = require('../db');
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);

  if (result.rows[0]?.role !== 'ADMIN') {
    return res.status(403).json({ msg: 'Access denied. Admins only.' });
  }

  next();
};
