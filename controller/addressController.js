const {
  createAddress,
  findAddressesByUserId,
  findAddressById,
  removeAddress
} = require("../models/addressModel");


exports.addAddress = async (req, res) => {
  try {
    const { user_id, city, zipcode, country, state, street, phone } = req.body;

    if (!user_id || !city || !zipcode || !country || !state || !street || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const address = await createAddress(user_id, city, zipcode, country, state, street, phone);
    res.status(201).json({ message: "Address added successfully", address });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getAddresses = async (req, res) => {
  try {
    const { user_id } = req.params;
    const addresses = await findAddressesByUserId(user_id);
    res.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await findAddressById(id);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    await removeAddress(id);
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Server error" });
  }
};
