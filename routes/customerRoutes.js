const express = require('express');
const router = express.Router();
const { getCustomers, deleteCustomer } = require('../controller/customerController');
const { isAdmin } = require('../middleware/roleMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.get('/customers', protect, isAdmin, getCustomers);
router.delete('/customer/:id', protect, isAdmin, deleteCustomer);

module.exports = router;
