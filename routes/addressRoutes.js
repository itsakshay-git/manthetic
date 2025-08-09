const express = require("express");
const router = express.Router();
const {
  addAddress,
  getAddresses,
  deleteAddress,
} = require("../controller/addressController");


router.post("/", addAddress);
router.get("/:user_id", getAddresses);
router.delete("/:id", deleteAddress);

module.exports = router;
