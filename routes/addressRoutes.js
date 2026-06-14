const express = require("express");
const router = express.Router();
const {
  addAddress,
  getAddresses,
  deleteAddress,
} = require("../controller/addressController");
const { validateRequest } = require('../middleware/validationMiddleware');
const { createAddressSchema } = require('../validation/addressValidation');
const { protect } = require("../middleware/authMiddleware");


router.post("/", protect, validateRequest(createAddressSchema), addAddress);
router.get("/:user_id", protect, getAddresses);
router.delete("/:id", protect, deleteAddress);

module.exports = router;
