const express = require('express');
const { styleFinder, reviewInsights } = require('../controller/aiController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/storefront/style-finder', styleFinder);
router.post('/admin/review-insights', protect, isAdmin, reviewInsights);

module.exports = router;