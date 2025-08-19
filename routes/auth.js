const express = require('express');
const router = express.Router();
const { register, login, getMe, makeAdmin, adminLogin, updatePassword } = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { loginSchema, registerSchema, updatePasswordSchema } = require('../validation/authValidation');

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/admin-login', validateRequest(loginSchema), adminLogin);
router.get('/me', protect, getMe);
router.put('/make-admin/:id', protect, makeAdmin);
router.put('/update-password', protect, validateRequest(updatePasswordSchema), updatePassword);

module.exports = router;
