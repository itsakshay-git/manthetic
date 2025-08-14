const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  getOrderByIdWithUser,
  getOrdersByUserId
} = require('../controller/orderController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/user/:id', protect, getOrdersByUserId);

router.get('/admin/orders', protect, isAdmin, getAllOrders);
router.put('/admin/order/:id', protect, isAdmin, updateOrderStatus);

module.exports = router;
