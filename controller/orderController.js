const pool = require('../db');
const Order = require('../models/orderModel');

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cartResult = await Order.getCartItemsByUserId(req.user.id);
    const cartItems = cartResult.rows;
    if (cartItems.length === 0) {
      return res.status(400).json({ msg: 'Cart is empty' });
    }

    let totalAmount = 0;

    for (const item of cartItems) {
      const variantResult = await Order.getVariantDetails(item.variant_id);
      if (variantResult.rows.length === 0) throw new Error('Invalid variant');

      const { price, stock } = variantResult.rows[0];
      if (stock < item.quantity) throw new Error('Insufficient stock');

      totalAmount += Number(price) * item.quantity;

      await Order.reduceStock(item.quantity, item.variant_id);
    }

    const orderResult = await Order.createOrder(req.user.id, totalAmount);
    const order = orderResult.rows[0];

    for (const item of cartItems) {
      const variantResult = await Order.getVariantDetails(item.variant_id);
      const { product_id, price } = variantResult.rows[0];

      await Order.addOrderItem(order.id, product_id, item.variant_id, item.quantity, price);
    }

    await Order.clearCart(req.user.id);

    await client.query('COMMIT');
    res.status(201).json({ msg: 'Order placed', order_id: order.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ msg: 'Order failed', error: err.message });
  } finally {
    client.release();
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
  console.log(id)
  const { status, payment_status } = req.body;


  const result = await Order.updateOrderStatus(status, payment_status, id);
  if (result.rows.length === 0) {
    return res.status(404).json({ msg: 'Order not found' });
  }

  res.json(result.rows[0]);
};
