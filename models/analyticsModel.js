const pool = require('../db');

exports.getTotalRevenue = async () => {
  const result = await pool.query(`SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders`);
  return result.rows[0].revenue;
};

exports.getTotalOrders = async () => {
  const result = await pool.query(`SELECT COUNT(*) AS order_count FROM orders`);
  return result.rows[0].order_count;
};

exports.getTotalCustomers = async () => {
  const result = await pool.query(`SELECT COUNT(*) AS customer_count FROM users WHERE role = 'CUSTOMER'`);
  return result.rows[0].customer_count;
};

exports.getMonthlySalesStats = async () => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      SUM(total_amount) AS total_sales,
      COUNT(*) AS total_orders
    FROM orders
    WHERE status != 'cancelled'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
  return result.rows.reverse(); // To return in ascending order
};

exports.getDailySalesStats = async (days = 30) => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
      SUM(total_amount) AS total_sales,
      COUNT(*) AS total_orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    AND status != 'cancelled'
    GROUP BY day
    ORDER BY day ASC
  `);
  return result.rows;
};

exports.getSalesOverview = async () => {
  const sales = await pool.query(`SELECT SUM(total_amount)::numeric(10,2) AS total_sales FROM orders`);
  const orders = await pool.query(`SELECT COUNT(*) AS total_orders FROM orders`);
  const customers = await pool.query(`SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer'`);

  return {
    totalSales: sales.rows[0].total_sales || 0,
    totalOrders: orders.rows[0].total_orders,
    totalCustomers: customers.rows[0].total_customers
  };
};
