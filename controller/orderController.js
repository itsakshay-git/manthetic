const pool = require('../db');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');


exports.createOrder = async (req, res) => {
  const client = await pool.connect();
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



    await client.query("BEGIN");


    const cartItems = await Cart.getCartItemsByUserId(req.user.id);
    console.log('Cart items from cart model:', cartItems);
    if (cartItems.length === 0) {
      return res.status(400).json({ msg: "Cart is empty" });
    }

    let totalAmount = 0;


    const orderResult = await Order.createOrder(
      req.user.id,
      totalAmount,
      address_id,
      normalizedPaymentMethod
    );
    const order = orderResult.rows[0];


    for (const item of cartItems) {
      console.log('Processing cart item:', item);
      console.log('Variant ID:', item.variant_id, 'Type:', typeof item.variant_id);
      console.log('Selected size:', item.selected_size, 'Type:', typeof item.selected_size);

      const variantData = await Order.getVariantPriceAndStockBySize(
        item.variant_id,
        item.selected_size
      );

      if (!variantData.rows || !variantData.rows.length) {
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

exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Order.getOrderById(id);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Order not found' });
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



