const express = require("express");
const router = express.Router();
const categoryController=require("../../controllers/categoryController");
const Authentication=require("../../config/middleware");
router.post("/add",Authentication(['admin']), categoryController.addCategory);
router.get("/",Authentication(['admin']), categoryController.getCategories);
router.get("/:id",Authentication(['admin']), categoryController.getCategoryById);
router.put("/update/:id",Authentication(['admin']), categoryController.updateCategory);
router.delete("/delete/:id",Authentication(['admin']), categoryController.deleteCategory);

module.exports = router;
