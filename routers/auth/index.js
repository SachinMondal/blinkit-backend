const express=require("express");
const router=express.Router();
const userController=require("../../controllers/userController");
const Authentication=require("../../config/middleware");
router.post("/send-otp",userController.sendOTP);
router.post("/verify-otp",userController.verifyOTP);
router.put("/update",Authentication(['user','admin']),userController.updateUser);

module.exports=router;