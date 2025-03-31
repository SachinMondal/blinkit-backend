const express = require("express");
const { addNewAddress, editAddress, getAllAddresses, deleteAddress } = require("../../controllers/addressController");
const Authentication = require("../../config/middleware"); 

const router = express.Router();


router.post("/add", Authentication(["user","admin"]), addNewAddress);
router.put("/edit/:addressId", Authentication(["user","admin"]), editAddress);
router.get("/all", Authentication(["user","admin"]), getAllAddresses);
router.delete("/delete/:addressId", Authentication(["user","admin"]), deleteAddress);

module.exports = router;
