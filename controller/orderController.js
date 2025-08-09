const pool = require('../db');
const Order = require('../models/orderModel');


exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { address_id, payment_method } = req.body;

    if (!address_id || !payment_method) {
      return res.status(400).json({ msg: "Address ID and payment method are required" });
    }

    await client.query("BEGIN");


    const cartResult = await Order.getCartItemsByUserId(req.user.id);
    const cartItems = cartResult.rows;
    console.log(cartItems)
    if (cartItems.length === 0) {
      return res.status(400).json({ msg: "Cart is empty" });
    }

    let totalAmount = 0;


    const orderResult = await Order.createOrder(
      req.user.id,
      totalAmount,
      address_id,
      payment_method
    );
    const order = orderResult.rows[0];


    for (const item of cartItems) {
      const variantData = await Order.getVariantPriceAndStockBySize(
        item.variant_id,
        item.selected_size
      );

      if (!variantData.rows.length) {
        throw new Error("Invalid size/variant");
      }

      const { price, stock, product_id } = variantData.rows[0];
      if (stock < item.quantity) {
        throw new Error("Insufficient stock");
      }

      totalAmount += Number(price) * item.quantity;

      await Order.reduceStock(item.variant_id, item.selected_size, item.quantity);

      await Order.addOrderItem(order.id, product_id, item.variant_id, item.quantity, price);
    }

    await Order.updateOrderTotal(order.id, totalAmount);

    await Order.clearCart(req.user.id);

    await client.query("COMMIT");
    res.status(201).json({ msg: "Order placed", order_id: order.id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ msg: "Order failed", error: err.message });
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
