const express = require("express");
const router = express.Router();

// // Mount the user-related routes under /auth
router.use("/auth", require("./auth"));
router.use("/category", require("./category"));
router.use("/product", require("./product"));
router.use("/other",require("./others"));
router.use("/cart",require("./cart"));
// router.use("/wallet",require("./wallet"));
// router.use('/payment',require("./payment"))
module.exports = router;