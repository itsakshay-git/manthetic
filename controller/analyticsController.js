const {
  getTotalRevenue,
  getTotalOrders,
  getTotalCustomers,
  getMonthlySalesStats,
  getDailySalesStats,
  getSalesOverview
} = require('../models/analyticsModel');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalRevenue, totalOrders, totalCustomers] = await Promise.all([
      getTotalRevenue(),
      getTotalOrders(),
      getTotalCustomers()
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue),
        totalOrders: Number(totalOrders),
        totalCustomers: Number(totalCustomers)
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics data' });
  }
};

exports.getSaleMonthlyState = async (req, res) => {
  try {
    const data = await getMonthlySalesStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching monthly sales', err });
  }
};

exports.getSaleDailyState = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const data = await getDailySalesStats(days);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching daily sales', err });
  }
};

exports.getSaleOverview = async (req, res) => {
  try {
    const data = await getSalesOverview();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching overview stats', err });
  }
};
