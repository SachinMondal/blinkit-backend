const express=require("express");
const router=express.Router();
const productController=require("../../controllers/productController");
const Authnetication=require("../../config/middleware");

router.get("/home",productController.getAllProductsWithCategory);
router.post("/add",Authnetication(['admin']),productController.addProduct);

router.get("/",Authnetication(['admin']), productController.getAllProduct);

router.get("/:id",Authnetication(['admin']), productController.getProductById);

router.get("/category/:id",Authnetication(['admin']), productController.getProductByCategoryId);
router.put("/update/:id",Authnetication(['admin']), productController.editProduct);

router.delete("/delete/:id",Authnetication(['admin']), productController.deleteProduct);

module.exports=router;