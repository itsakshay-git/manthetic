const { getAllCustomers, deleteCustomerById } = require('../models/userModel');

exports.getCustomers = async (req, res) => {
  try {
    const result = await getAllCustomers();
    res.json({ success: true, users: result});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching customers' });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await deleteCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.status(200).json({ message: 'Customer deleted', customer });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting customer' });
  }
};
