const express=require("express");
const router=express.Router();
const Authentication=require("../../config/middleware");
const otherController=require("../../controllers/otherController");
router.get('/banners',otherController.getAllBanners);
router.post('/upload',Authentication(['admin']),otherController.uploadBanner);
router.delete('/delete/:id',Authentication(['admin']),otherController.deleteBanner);
module.exports=router;