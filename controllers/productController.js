const Product=require("../models/productModel");
const Category=require("../models/categoryModel")
const {uploadImage,deleteImage}=require("../utils/uploadImage");
const cloudinary = require("../config/Cloudinary");
const Variant=require("../models/VariantModel");


const addProduct = async (req, res) => {
  try {
    const {
      category,
      categoryName,
      productName, 
      productDescription, 
      weight,
      stock,
      vegNonVeg, 
      brand,
      size,
      packerDetails,
      variantSize,
      returnPolicy,
      manufacturerAddress,
      marketerAddress,
      countryOfOrigin,
      customerCare,
      seller,
      disclaimer,
      details, 
      quantities,
    } = req.fields;
    let imageUrl = "";
    if (req.files?.image) {
      imageUrl = await uploadImage(req.files.image.path);
    }

    const parsedQuantities = typeof quantities === "string" ? JSON.parse(quantities) : quantities || [];
    const parsedDetails = typeof details === "string" ? JSON.parse(details) : details || [];


    // 🔹 Step 4: Create Product Document
    const newProduct = new Product({
      category,
      categoryName,
      name: productName, 
      description: productDescription, 
      image: imageUrl,
      weight,
      stock,
      type: vegNonVeg, 
      brand,
      size,
      packerDetails,
      variantSize,
      returnPolicy,
      manufacturerAddress,
      marketerAddress,
      countryOfOrigin,
      customerCare,
      seller,
      disclaimer,
      details: parsedDetails,
    });

    // 🔹 Step 5: Save Product
    await newProduct.save();

    // 🔹 Step 6: Create and Save Variants (if any)
    let createdVariants = [];
    if (parsedQuantities.length > 0) {
      const variantDocs = parsedQuantities.map(variant => ({
        product: newProduct._id,
        qty: variant.qty,
        unit: variant.unit,
        price: variant.price,
        discountPrice: variant.discountPrice,
      }));

      createdVariants = await Variant.insertMany(variantDocs);

      // 🔹 Step 7: Link Variants to Product
      newProduct.variants = createdVariants.map(variant => variant._id);
      await newProduct.save();
    }

    res.status(201).json({
      message: "Product added successfully",
      product: newProduct,
      variants: createdVariants,
    });

  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: error.message });
  }
};



const getAllProduct=async (req,res)=>{
    try{
        const products=await Product.find().populate("category","name");
        res.status(200).json({success:true,data:products});
    }catch(error){
        console.error("Error getting products:",error);
        res.status(500).json({message:error.message});
    }
}

const getProductById=async (req,res)=>{
    try{
        const product=await Product.findById(req.params.id).populate("category","name").populate("variants");
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        res.status(200).json({success:true,data:product});
    }catch(error){
        console.error("Error getting product by ID:",error);
        res.status(500).json({message:error.message});
    }
}

const getProductByCategoryId=async(req,res)=>{
    try{
        const products=await Product.find({category:req.params.id});
        if(!products){
            return res.status(404).json({message:"Products not found"});
        }
        res.status(200).json({success:true,data:products});
    }catch(error){
        console.error("Error getting products by category ID:",error);
        res.status(500).json({message:error.message});
    }
}
const editProduct = async (req, res) => {
  try {
    const { quantities, details, ...updatedFields } = req.fields;
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found!" });
    }
    let imageUrl = existingProduct.image;
    if (req.files && req.files.image) {
      if (existingProduct.image) {
        try {
          await deleteImage(existingProduct.image);
        } catch (error) {
          console.error("Error deleting existing image:", error);
        }
      }
      imageUrl = await uploadImage(req.files.image.path);
    }
    let newDetails = existingProduct.details;
    if (details) {
      try {
        newDetails = JSON.parse(details);
      } catch (error) {
        return res.status(400).json({ message: "Invalid details format" });
      }
    }
    let newVariants = [];
    if (quantities) {
      try {
        newVariants = JSON.parse(quantities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid variants format" });
      }
    }
    Object.keys(updatedFields).forEach((key) => {
      if (updatedFields[key] !== undefined && updatedFields[key] !== existingProduct[key]) {
        existingProduct[key] = updatedFields[key];
      }
    });
    if (imageUrl !== existingProduct.image) {
      existingProduct.image = imageUrl;
    }
    if (JSON.stringify(newDetails) !== JSON.stringify(existingProduct.details)) {
      existingProduct.details = newDetails;
    }
    await existingProduct.save();
    if (newVariants.length > 0) {
      const existingVariants = await Variant.find({ product: existingProduct._id });
      if (JSON.stringify(existingVariants) !== JSON.stringify(newVariants)) {
        await Variant.deleteMany({ product: existingProduct._id });
        const variantDocs = newVariants.map((variant) => ({
          product: existingProduct._id,
          qty: variant.qty,
          unit: variant.unit,
          price: variant.price,
          discountPrice: variant.discountPrice,
        }));
        const createdVariants = await Variant.insertMany(variantDocs);
        existingProduct.variants = createdVariants.map((variant) => variant._id);
        await existingProduct.save();
      }
    }

    res.json({ message: "Product updated successfully", updatedProduct: existingProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: error.message });
  }
};



  const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.image) {
        const publicId = product.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
      await Product.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error deleting product", error });
    }
  };
  
  const getAllProductsWithCategory = async (req, res) => {
    try {
      const categories = await Category.find({}, "name _id isParent isVisible isHomePageVisible isSpecial isNew isSale isFeatured").lean();
      const products = await Product.find({})
        .populate("category", "name _id isParent isVisible isHomePageVisible isSpecial isNew isSale isFeatured")
        .populate("variants")
        .lean();
  
   
  
      
      const groupedProducts = categories.reduce((acc, category) => {
        acc[category.name] = {
          categoryId: category._id,
          categoryDetails: {
            isParent: category.isParent,
            isVisible: category.isVisible,
            isHomePageVisible: category.isHomePageVisible,
            isSpecial: category.isSpecial,
            isNew: category.isNew,
            isSale: category.isSale,
            isFeatured: category.isFeatured,
            name: category.name,
            _id: category._id,
          },
          products: [],
        };
        return acc;
      }, {});
  
      
      products.forEach((product) => {
        const category = product.category;
        if (category && groupedProducts[category.name]) {
          groupedProducts[category.name].products.push(product);
        }
      });
  
      res.status(200).json({ success: true, categories: groupedProducts });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  
  

  module.exports = {
    addProduct,
    getAllProduct,
    getProductById,
    getProductByCategoryId,
    editProduct,
    deleteProduct,
    getAllProductsWithCategory,
  };
