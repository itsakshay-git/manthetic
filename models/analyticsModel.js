const pool = require('../db/index');
const prisma = require('../db/prisma');

exports.getTotalRevenue = async () => {
  const result = await prisma.order.aggregate({
    _sum: {
      totalAmount: true
    }
  });
  return result._sum.totalAmount || 0;
};

exports.getTotalOrders = async () => {
  const result = await prisma.order.count();
  return result;
};

exports.getTotalCustomers = async () => {
  const result = await prisma.user.count({
    where: {
      role: 'CUSTOMER'
    }
  });
  return result;
};

exports.getMonthlySalesStats = async () => {
  // Use original pool for complex date formatting queries
  const query = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      SUM(total_amount) AS total_sales,
      COUNT(*) AS total_orders
    FROM orders
    WHERE status != 'CANCELLED'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  try {
    const result = await pool.query(query);
    return result.rows.reverse(); // To return in ascending order
  } catch (error) {
    console.error('Error in getMonthlySalesStats:', error);
    throw error;
  }
};

exports.getDailySalesStats = async (days = 30) => {
  // Use original pool for complex date formatting queries
  const query = `
    SELECT 
      TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
      SUM(total_amount) AS total_sales,
      COUNT(*) AS total_orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    AND status != 'CANCELLED'
    GROUP BY day
    ORDER BY day ASC
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error in getDailySalesStats:', error);
    throw error;
  }
};

exports.getSalesOverview = async () => {
  const sales = await prisma.order.aggregate({
    _sum: {
      totalAmount: true
    }
  });

  const orders = await prisma.order.count();

  const customers = await prisma.user.count({
    where: {
      role: 'CUSTOMER'
    }
  });

  return {
    totalSales: sales._sum.totalAmount || 0,
    totalOrders: orders,
    totalCustomers: customers
  };
};
