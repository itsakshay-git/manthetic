const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const userModel = require('../models/userModel');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await userModel.findUserByEmail(email);
  if (existing) return res.status(400).json({ msg: 'Email already in use' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await userModel.createUser(name, email, hashed);

  res.status(201).json({
    token: generateToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  res.json({
    token: generateToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  console.log(email, password)

  const user = await userModel.findUserByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ msg: 'Invalid credentials' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ msg: 'Access denied: Admins only' });
  }

  res.json({
    token: generateToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

exports.getMe = async (req, res) => {
  const user = await userModel.getUserById(req.user.id);
  res.json(user);
};

exports.makeAdmin = async (req, res) => {
  const userId = req.params.id;

  try {
    const updated = await userModel.updateUserRole(userId, 'ADMIN');
    res.status(200).json({ msg: 'User promoted to admin', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
};
