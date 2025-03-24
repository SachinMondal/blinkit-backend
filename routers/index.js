const express = require("express");
const router = express.Router();

// // Mount the user-related routes under /auth
router.use("/auth", require("./auth"));
// router.use("/metro", require("./metro"));
// router.use("/card", require("./card"));
// router.use("/chatbot",require("./chatbot"));
// router.use("/automation",require("./people"));
// router.use("/wallet",require("./wallet"));
// router.use('/payment',require("./payment"))
module.exports = router;