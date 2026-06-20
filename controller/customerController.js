const { getAllCustomers, getCustomerIntentById, deleteCustomerById } = require('../models/userModel');

exports.getCustomers = async (req, res) => {
  try {
    const result = await getAllCustomers();
    res.json({ success: true, users: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching customers' });
  }
};

exports.getCustomerIntent = async (req, res) => {
  try {
    const result = await getCustomerIntentById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true, intent: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching customer intent' });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await deleteCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.status(200).json({ message: 'Customer deleted', customer });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting customer' });
  }
};