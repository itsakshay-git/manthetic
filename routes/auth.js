const express = require('express');
const router = express.Router();
const { register, login, getMe, makeAdmin, adminLogin } = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.put('/make-admin/:id', protect, makeAdmin);

module.exports = router;
