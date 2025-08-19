const express = require("express");
const router = express.Router();
const {
  addAddress,
  getAddresses,
  deleteAddress,
} = require("../controller/addressController");
const { validateRequest } = require('../middleware/validationMiddleware');
const { createAddressSchema } = require('../validation/addressValidation');


router.post("/", validateRequest(createAddressSchema), addAddress);
router.get("/:user_id", getAddresses);
router.delete("/:id", deleteAddress);

module.exports = router;
