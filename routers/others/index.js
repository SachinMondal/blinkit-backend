const express=require("express");
const router=express.Router();
const Authentication=require("../../config/middleware");
const otherController=require("../../controllers/otherController");
const { getSettings, updateSettings } = require("../../controllers/settingsController");

router.get('/banners',otherController.getAllBanners);
router.post('/upload',Authentication(['admin']),otherController.uploadBanner);
router.delete('/delete/:id',Authentication(['admin']),otherController.deleteBanner);

router.get("/settings", Authentication(['admin']), getSettings);
router.post("/settings", Authentication(['admin']), updateSettings);
module.exports=router;