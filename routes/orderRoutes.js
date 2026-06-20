const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderById,
  getOrdersByUserId,
  getDeliveredOrdersByUserId
} = require('../controller/orderController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { createOrderSchema, updateOrderStatusSchema } = require('../validation/orderValidation');

router.post('/', protect, validateRequest(createOrderSchema), createOrder);
router.get('/', protect, getMyOrders);

router.get('/admin/orders', protect, isAdmin, getAllOrders);
router.put('/admin/order/:id', protect, isAdmin, validateRequest(updateOrderStatusSchema), updateOrderStatus);
router.get('/user/delivered-orders/:id', protect, getDeliveredOrdersByUserId);
router.get('/user/:id', protect, getOrdersByUserId);
router.put('/:id/cancel', protect, cancelOrder);
router.get('/:id', protect, getOrderById);

module.exports = router;
