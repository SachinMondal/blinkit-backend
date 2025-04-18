const express=require("express");
const router=express.Router();
const userController=require("../../controllers/userController");
const Authentication=require("../../config/middleware");
router.post("/send-otp",userController.sendOTP);
router.post("/verify-otp",userController.verifyOTP);
router.put("/update",Authentication(['user','admin']),userController.updateUser);
router.get("/info",Authentication(['user','admin']),userController.loggedInUser);
router.get("/all-users",Authentication(['admin']),userController.getAllUser);
router.put("/updateRole",Authentication(['admin']),userController.updateUserRole);
router.put("/location",Authentication(['admin','user']),userController.saveLocation);
module.exports=router;