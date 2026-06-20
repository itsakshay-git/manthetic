const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerIntent, deleteCustomer } = require('../controller/customerController');
const { isAdmin } = require('../middleware/roleMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.get('/customers', protect, isAdmin, getCustomers);
router.get('/customer/:id/intent', protect, isAdmin, getCustomerIntent);
router.delete('/customer/:id', protect, isAdmin, deleteCustomer);

module.exports = router;