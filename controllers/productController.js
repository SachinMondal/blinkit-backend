const Product=require("../models/productModel");
const {uploadImage,deleteImage}=require("../utils/uploadImage");
const cloudinary=require("../config/Cloudinary");
const addProduct = async (req, res) => {
  try {
    console.log("Received Data:", req.fields);

    const {
      category,
      name,
      description,
      weight,
      shelfLife,
      netWeight,
      type,
      brand,
      size,
      quantities,
    } = req.fields;

    let imageUrl = "";
    if (req.files && req.files.image) {
      imageUrl = await uploadImage(req.files.image.path);
    }

    // 🛠 Parse the JSON string back to an array
    const variants = JSON.parse(quantities);

    const newProduct = new Product({
      category,
      name,
      description,
      image: imageUrl,
      weight,
      shelfLife,
      netWeight,
      type,
      brand,
      size,
      variants,
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", newProduct });
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
        const product=await Product.findById(req.params.id).populate("category","name");
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


    const {
      category,
      name,
      description,
      weight,
      shelfLife,
      netWeight,
      type,
      brand,
      size,
      quantities, 
    } = req.fields;

    // Find the existing product
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
    

    let variants = [];
    if (quantities) {
      try {
        variants = JSON.parse(quantities);
      } catch (error) {
        return res.status(400).json({ message: "Invalid variants format" });
      }
    }

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        category,
        name,
        description,
        image: imageUrl,
        weight,
        shelfLife,
        netWeight,
        type,
        brand,
        size,
        variants,
      },
      { new: true }
    );

    res.json({ message: "Product updated successfully", updatedProduct });
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
  
  module.exports = {
    addProduct,
    getAllProduct,
    getProductById,
    getProductByCategoryId,
    editProduct,
    deleteProduct,
  };
