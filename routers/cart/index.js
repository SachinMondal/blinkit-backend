const express=require("express");
const router=express.Router();
const cartController=require("../../controllers/cartController");
const Authentication=require("../../config/middleware");
router.get("/",  Authentication(["user","admin"]),cartController.getCart);
router.post("/addToCart", Authentication(["user","admin"]),cartController.addToCart);
router.post("/remove", Authentication(["user","admin"]), cartController.removeFromCart);
router.delete("/clear",  Authentication(["user","admin"]),cartController.emptyCart);
module.exports=router;