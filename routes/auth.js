const express = require('express');
const router = express.Router();
const { register, login, getMe, makeAdmin, adminLogin, updatePassword } = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.put('/make-admin/:id', protect, makeAdmin);
router.put('/update-password', protect, updatePassword);

module.exports = router;
