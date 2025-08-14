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

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Get user from DB
    const user = await userModel.findUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update in DB
    await userModel.updateUserPassword(user.id, hashedNewPassword);

    res.status(200).json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

