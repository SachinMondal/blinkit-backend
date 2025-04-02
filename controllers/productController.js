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
    const { quantities, details, ...updatedFields } = req.fields; // Extract fields

    console.log("Incoming Fields:", req.fields);

    // 🛠 Find the existing product
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found!" });
    }

    let imageUrl = existingProduct.image;

    // 🔹 Handle Image Update (only if a new image is uploaded)
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

    // 🔹 Parse and update details (only if provided)
    let newDetails = existingProduct.details;
    if (details) {
      try {
        newDetails = JSON.parse(details);
      } catch (error) {
        return res.status(400).json({ message: "Invalid details format" });
      }
    }

    // 🔹 Parse and update variants (only if provided)
    let newVariants = [];
    if (quantities) {
      try {
        newVariants = JSON.parse(quantities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid variants format" });
      }
    }

    // 🔹 Update only changed fields
    Object.keys(updatedFields).forEach((key) => {
      if (updatedFields[key] !== undefined && updatedFields[key] !== existingProduct[key]) {
        existingProduct[key] = updatedFields[key];
      }
    });

    // Update image only if it has changed
    if (imageUrl !== existingProduct.image) {
      existingProduct.image = imageUrl;
    }

    // Update details only if changed
    if (JSON.stringify(newDetails) !== JSON.stringify(existingProduct.details)) {
      existingProduct.details = newDetails;
    }

    await existingProduct.save();

    // 🔹 Handle Variants (Only if changed)
    if (newVariants.length > 0) {
      // 🗑 Delete old variants only if they are different
      const existingVariants = await Variant.find({ product: existingProduct._id });

      if (JSON.stringify(existingVariants) !== JSON.stringify(newVariants)) {
        await Variant.deleteMany({ product: existingProduct._id });

        // 🔄 Insert new variants
        const variantDocs = newVariants.map((variant) => ({
          product: existingProduct._id,
          qty: variant.qty,
          unit: variant.unit,
          price: variant.price,
          discountPrice: variant.discountPrice,
        }));

        const createdVariants = await Variant.insertMany(variantDocs);

        // 🔄 Update Product with new Variant IDs
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
  
      // 🔹 Extract Cloudinary Public ID from the image URL
      if (product.image) {
        const publicId = product.image.split("/").pop().split(".")[0]; // Extract Cloudinary ID
  
        // 🔥 Delete Image from Cloudinary
        await cloudinary.uploader.destroy(publicId);
      }
  
      // 🔥 Delete the product from the database
      await Product.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Error deleting product", error });
    }
  };
  
  const getAllProductsWithCategory = async (req, res) => {
    try {
      const categories = await Category.find({}, "name _id").lean();
      const products = await Product.find({}).populate("category", "name _id").lean(); 
    
      // Group products by category
      const groupedProducts = categories.reduce((acc, category) => {
        acc[category.name] = { categoryId: category._id, products: [] };
        return acc;
      }, {});
  
      // Add products to their respective categories
      products.forEach((product) => {
        const categoryName = product.category?.name || "Uncategorized";
        const categoryId = product.category?._id || "Unknown";
  
        if (!groupedProducts[categoryName]) {
          groupedProducts[categoryName] = { categoryId, products: [] };
        }
  
        groupedProducts[categoryName].products.push(product);
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
