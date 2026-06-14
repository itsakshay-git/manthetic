const Order = require('../models/orderModel');


exports.createOrder = async (req, res) => {
  try {
    const { address_id, payment_method } = req.body;

    if (!address_id || !payment_method) {
      return res.status(400).json({ msg: "Address ID and payment method are required" });
    }

    // Normalize payment method values from frontend to database format
    let normalizedPaymentMethod = payment_method;
    if (payment_method === 'cod') {
      normalizedPaymentMethod = 'CASH_ON_DELIVERY';
    } else if (payment_method === 'online') {
      normalizedPaymentMethod = 'ONLINE_PAYMENT';
    }



    const order = await Order.placeOrder(
      req.user.id,
      address_id,
      normalizedPaymentMethod
    );

    res.status(201).json({ msg: "Order placed", order_id: order.id });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 500) {
      console.error(err.message);
    }
    res.status(status).json({ msg: "Order failed", error: err.message });
  }
};




exports.getMyOrders = async (req, res) => {
  const result = await Order.getUserOrders(req.user.id);
  res.json(result.rows);
};

exports.getAllOrders = async (req, res) => {
  const result = await Order.getAllOrders();
  res.json(result.rows);
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;


  const result = await Order.updateOrderStatus(status, payment_status, id);
  if (result.rows.length === 0) {
    return res.status(404).json({ msg: 'Order not found' });
  }

  res.json(result.rows[0]);
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Order.getOrderById(id);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    const order = result.rows[0];
    if (order.customer_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};


exports.getOrdersByUserId = async (req, res) => {
  const { id } = req.params; // user ID
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    if (parseInt(id) !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: "Access denied" });
    }

    const result = await Order.getOrdersByUserIdAdmin(id, limit, offset); // pass pagination
    const totalResult = await Order.getOrdersCountByUserId(id); // total orders count

    if (!result.rows.length) {
      return res.status(404).json({ msg: "No orders found for this user" });
    }

    const totalOrders = totalResult.rows[0].count;
    const hasMore = offset + result.rows.length < totalOrders;

    res.json({
      orders: result.rows,
      page,
      limit,
      totalOrders,
      hasMore
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Failed to fetch user orders" });
  }
};

exports.getDeliveredOrdersByUserId = async (req, res) => {
  const { id } = req.params; // user ID
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    if (parseInt(id) !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ msg: "Access denied" });
    }

    const result = await Order.getDeliveredOrdersByUserId(id, limit, offset);
    const totalResult = await Order.getDeliveredOrdersCountByUserId(id);

    if (!result.rows.length) {
      return res.status(404).json({ msg: "No delivered orders found for this user" });
    }

    const totalOrders = parseInt(totalResult.rows[0].count, 10);
    const hasMore = offset + result.rows.length < totalOrders;

    res.json({
      orders: result.rows,
      page,
      limit,
      totalOrders,
      hasMore,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Failed to fetch delivered orders" });
  }
};



