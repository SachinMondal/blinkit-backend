const express = require("express");
const {
    createNewOrder,
    updateOrder,
    deleteOrder,
    getUserOrders,
    getAllOrdersForAdmin,
    getOrderById
} = require("../../controllers/orderController");
const Authentication = require("../../config/middleware"); 

const router = express.Router();

router.post("/", Authentication(["user","admin"]), createNewOrder); 
router.get("/my-orders", Authentication(["user","admin"]), getUserOrders); 
router.put("/:orderId", Authentication(["admin"]), updateOrder); 
router.delete("/:orderId", Authentication(["admin"]), deleteOrder); 
router.get("/all", Authentication(["admin"]), getAllOrdersForAdmin);
router.get("/order/:orderId", Authentication(["admin"]), getOrderById);


module.exports = router;
