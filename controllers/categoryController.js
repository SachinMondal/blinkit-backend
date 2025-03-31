const Category = require("../models/categoryModel");
const {uploadImage}=require("../utils/uploadImage");
const cloudinary = require("../config/cloudinary");
const mongoose=require("mongoose");
const addCategory = async (req, res) => {
  try {
    const { name, description, attributes, parentCategory } = req.fields;
    let imageUrl = "";

    // Check if an image is provided
    if (req.files.image) {
      imageUrl = await uploadImage(req.files.image.path);
    }

    // Determine if this category is a parent
    let isParent = !parentCategory;

    // Create new category
    const newCategory = new Category({
      name,
      description,
      image: imageUrl,
      attributes,
      parentCategory,
      isParent,
    });

    await newCategory.save();
    res
      .status(201)
      .json({ message: "Category added successfully", newCategory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parentCategory", "name");
    res.status(200).json({success:true,data:categories});
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({ message: "Error fetching categories", error });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "parentCategory",
      "name"
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error fetching category", error });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, attributes, seoTitle, seoDescription, isVisible, parentCategory } = req.fields;
    let imageUrl = "";

    // Check if an image is provided
    if (req.files?.image) {
      imageUrl = await uploadImage(req.files.image.path);
    }

    // Determine if this category is a parent
    let isParent = !parentCategory;

    // Find and update the category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
        attributes,
        seoTitle,
        seoDescription,
        isVisible,
        parentCategory,
        isParent,
        ...(imageUrl && { image: imageUrl }), // Only update image if new image is provided
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category updated successfully", updatedCategory });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: error.message });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 🔹 Extract Cloudinary Public ID from the image URL
    if (category.image) {
      const publicId = category.image.split("/").pop().split(".")[0]; // Extract ID
    

      // 🔥 Delete Image from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    }

    // 🔥 Delete the category from the database
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Error deleting category", error });
  }
};

const getCategoriesWithSubcategories = async (req,res) => {
  try {    
    const categoriesWithSubcategories = await Category.aggregate([
      {
        $match: { parentCategory: null },
      },
      {
        $lookup: {
          from: "categories", 
          localField: "_id",
          foreignField: "parentCategory",
          as: "subcategories",
        },
      },
    ]);
    return res.status(200).json({success: true,data:categoriesWithSubcategories});
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    throw error;
  }
};

const getSubcategoriesWithProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required" });
    }

    // MongoDB aggregation pipeline
    const categoriesWithSubcategories = await Category.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(categoryId) }, // Find the main category
      },
      {
        $lookup: {
          from: "categories", // Lookup subcategories
          localField: "_id",
          foreignField: "parentCategory",
          as: "subcategories",
        },
      },
      {
        $unwind: {
          path: "$subcategories",
          preserveNullAndEmptyArrays: true, // Keep parent category if no subcategories
        },
      },
      {
        $lookup: {
          from: "products", // Lookup products for each subcategory
          localField: "subcategories._id",
          foreignField: "category",
          as: "subcategories.products",
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          subcategories: { $push: "$subcategories" }, // Collect subcategories with products
        },
      },
    ]);

    // If no category is found, return an empty response
    if (!categoriesWithSubcategories.length) {
      return res.status(404).json({ message: "No subcategories found for this category." });
    }

    res.status(200).json(categoriesWithSubcategories[0]);
  } catch (error) {
    console.error("Error fetching subcategories and products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesWithSubcategories,
  getSubcategoriesWithProducts,
};
