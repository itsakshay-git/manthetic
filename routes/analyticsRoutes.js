const express = require('express');
const router = express.Router();
const { getDashboardStats, getSaleDailyState, getSaleMonthlyState, getSaleOverview } = require('../controller/analyticsController');
const { isAdmin } = require('../middleware/roleMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.get('/admin/dashboard-stats', protect, isAdmin, getDashboardStats);
router.get('/admin/analytics/sales/monthly',protect, isAdmin, getSaleMonthlyState);
router.get('/admin/analytics/sales/daily',protect, isAdmin, getSaleDailyState);
router.get('/admin/analytics/overview',protect, isAdmin, getSaleOverview);

module.exports = router;