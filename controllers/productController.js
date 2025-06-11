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
    let images = [];

   s
    const rawFiles = req.files['images[]'];
    if (rawFiles) {
      const filesArray = Array.isArray(rawFiles) ? rawFiles : [rawFiles];

      images = await Promise.all(
        filesArray.map(async (file) => {
          return await uploadImage(file.path);
        })
      );
    }

    // Parse JSON fields safely
    const parsedQuantities = typeof quantities === "string" ? JSON.parse(quantities) : quantities || [];
    const parsedDetails = typeof details === "string" ? JSON.parse(details) : details || [];

    const newProduct = new Product({
      category,
      categoryName,
      name: productName,
      description: productDescription,
      images, // array of image URLs
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

    const categoryData = await Category.findById(category);
    await newProduct.save();

    let createdVariants = [];
    if (parsedQuantities.length > 0) {
      const variantDocs = parsedQuantities.map((variant) => ({
        product: newProduct._id,
        qty: variant.qty,
        unit: variant.unit,
        price: variant.price,
        discount: variant.discountPrice,
        discountPrice: parseFloat((variant.discountPrice * variant.price) / 100),
        categoryDiscount: parseFloat((categoryData.discountPercentage * variant.price) / 100),
      }));

      createdVariants = await Variant.insertMany(variantDocs);
      newProduct.variants = createdVariants.map((variant) => variant._id);
      await newProduct.save();
    }

    res.status(201).json({
      message: "Product added successfully",
      product: newProduct,
      variants: createdVariants,
    });
  } catch (error) {
    console.error("Add product error:", error);
    return res.status(500).json({ message: error.message });
  }
};



const getAllProduct=async (req,res)=>{
    try{
        const products=await Product.find().populate("category","name");
        res.status(200).json({success:true,data:products});
    }catch(error){
        
        return res.status(500).json({message:error.message});
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
        
        return res.status(500).json({message:error.message});
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
        
        return res.status(500).json({message:error.message});
    }
}

const editProduct = async (req, res) => {
  try {
    const { quantities, details, variants, ...updatedFields } = req.fields;
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found!" });
    }

    let imageUrls = existingProduct.images||[];
    if (req.files && req.files.images) {
      // Delete old images from Cloudinary
      if (existingProduct.images && existingProduct.images.length > 0) {
        for (const imgUrl of existingProduct.images) {
          try {
            // Extract publicId from the URL to delete from Cloudinary
            const publicId = imgUrl.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn("Failed to delete old image:", err);
          }
        }
      }

      // Upload new images
      imageUrls = [];
      if (Array.isArray(req.files.images)) {
        for (const file of req.files.images) {
          const url = await uploadImage(file.path);
          imageUrls.push(url);
        }
      } else {
        const url = await uploadImage(req.files.images.path);
        imageUrls.push(url);
      }
    }

    let newDetails = existingProduct.details;
    if (details) {
      try {
        newDetails = JSON.parse(details);
      } catch (error) {
        return res.status(400).json({ message: "Invalid details format" });
      }
    }

    let newQuantities = [];
    if (quantities) {
      try {
        newQuantities = JSON.parse(quantities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid quantities format" });
      }
    }

    let newVariants = [];
    if (variants) {
      try {
        newVariants = JSON.parse(variants);
      } catch (error) {
        return res.status(400).json({ message: "Invalid variants format" });
      }
    }

    // Update only the fields that changed
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

    // Replace variants if newVariants is provided
    if (newVariants.length > 0) {
      await Variant.deleteMany({ product: existingProduct._id });

      const variantDocs = newVariants.map((variant) => {
        const discountPrice = Number((variant.price * variant.discount) / 100).toFixed(2);
        const categoryDiscount = variant.categoryDiscount
          ? Number(variant.categoryDiscount).toFixed(2)
          : 0;

        return {
          product: existingProduct._id,
          qty: variant.qty,
          unit: variant.unit,
          price: variant.price,
          discount: variant.discount,
          discountPrice: Number(discountPrice),
          categoryDiscount: Number(categoryDiscount),
        };
      });

      const createdVariants = await Variant.insertMany(variantDocs);
      existingProduct.variants = createdVariants.map((variant) => variant._id);
    }

    await existingProduct.save();

    res.json({ message: "Product updated successfully", updatedProduct: existingProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ message: error.message });
  }
};


const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
       if (product.images && product.images.length > 0) {
      for (const imgUrl of product.images) {
        const publicId = imgUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }
      await Product.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      
      return res.status(500).json({ message: "Error deleting product", error });
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
      
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
const searchProducts = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Please provide a search query" });
    }

    const regex = new RegExp(query, "i");

    const products = await Product.find({ name: regex });

    const categories = await Category.find({ name: regex }).select("_id name image");

    res.status(200).json({
      success: true,
      data: {
        products,
        categories,
      },
      message:
        products.length > 0 || categories.length > 0
          ? "Results found"
          : "No results found",
    });
  } catch (error) {
    
    return res.status(500).json({ message: "Server Error", error: error.message });
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
    searchProducts,
  };
