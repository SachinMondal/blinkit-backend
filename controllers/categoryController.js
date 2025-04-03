const Category = require("../models/categoryModel");
const Product=require("../models/productModel")
const {uploadImage}=require("../utils/uploadImage");
const cloudinary = require("../config/Cloudinary");
const mongoose=require("mongoose");
const addCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      attributes,
      parentCategory,
      tags,
      discountPercentage,
      status,
      seoTitle,
      seoDescription,
      isVisible,
      isHomePageVisible,
      isSpecial,
      isNew,
      isSale,
      isFeatured,
      isBestseller
    } = req.fields;
    console.log(req.fields);

    let imageUrl = "";

    if (req.files && req.files.image) {
      imageUrl = await uploadImage(req.files.image.path);
    }

    
    const tagsArray = tags ? tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

   
    const parseBoolean = (value) => !!(value && (value === "on" || value === "true" || value === true));

    // Create new category
    const newCategory = new Category({
      name,
      description,
      image: imageUrl,
      attributes,
      parentCategory,
      isParent: !parentCategory,
      tags: tagsArray,
      discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
      status: status || "active",
      seoTitle: seoTitle && seoTitle.trim() !== "" ? seoTitle.trim() : `${name} - Best ${name} Category`,
      seoDescription: seoDescription && seoDescription.trim() !== "" 
        ? seoDescription.trim() 
        : description 
          ? description.substring(0, 150) 
          : `Explore the best ${name} products and services.`,
      isVisible: parseBoolean(isVisible),
      isHomePageVisible: parseBoolean(isHomePageVisible),
      isSpecial: parseBoolean(isSpecial),
      isNew: parseBoolean(isNew),
      isSale: parseBoolean(isSale),
      isFeatured: parseBoolean(isFeatured),
      isBestseller: parseBoolean(isBestseller)
    });

    await newCategory.save();
    res.status(201).json({ message: "Category added successfully", newCategory });
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
    const {
      name,
      description,
      attributes,
      parentCategory,
      tags,
      discountPercentage,
      status,
      seoTitle,
      seoDescription,
      isVisible,
      isHomePageVisible,
      isSpecial,
      isNew,
      isSale,
      isFeatured,
      isBestseller
    } = req.fields;

    let imageUrl = "";

    if (req.files?.image) {
      imageUrl = await uploadImage(req.files.image.path);
    }

    const tagsArray = tags ? tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    const parseBoolean = (value) => !!(value && (value === "on" || value === "true" || value === true));

    let isParent = !parentCategory;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
        attributes,
        isParent,
        tags: tagsArray,
        discountPercentage: discountPercentage ? Number(discountPercentage) : 0,
        status: status || "active",
        seoTitle: seoTitle && seoTitle.trim() !== "" ? seoTitle.trim() : `${name} - Best ${name} Category`,
        seoDescription: seoDescription && seoDescription.trim() !== "" 
          ? seoDescription.trim() 
          : description 
            ? description.substring(0, 150) 
            : `Explore the best ${name} products and services.`,
        isVisible: parseBoolean(isVisible),
        isHomePageVisible: parseBoolean(isHomePageVisible),
        isSpecial: parseBoolean(isSpecial),
        isNew: parseBoolean(isNew),
        isSale: parseBoolean(isSale),
        isFeatured: parseBoolean(isFeatured),
        isBestseller: parseBoolean(isBestseller),
        ...(imageUrl && { image: imageUrl })
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
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid categoryId" });
    }

    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    // Find the category details
    const category = await Category.findById(categoryObjectId).lean();
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check if the category is a parent or a subcategory
    const isSubcategory = !!category.parentCategory; // If parentCategory exists, it's a subcategory

    // Fetch products directly under this category
    const categoryProducts = await Product.find({ category: categoryObjectId })
      .populate("variants")
      .lean();

    // Fetch all subcategories for the category
    const subcategories = await Category.find({ parentCategory: categoryObjectId }).lean();
    const subcategoryIds = subcategories.map((sub) => sub._id);

    // Fetch products for each subcategory
    const subcategoryProducts = await Product.find({ category: { $in: subcategoryIds } })
      .populate("variants")
      .lean();

    // Combine subcategories with their respective products
    let subcategoriesWithProducts = subcategories.map((subcategory) => ({
      _id: subcategory._id,
      name: subcategory.name,
      image: subcategory.image || "",
      products: subcategoryProducts.filter((product) => product.category.toString() === subcategory._id.toString()),
    }));

    // If the given category is itself a subcategory and has products, include it in the response
    if (isSubcategory) {
      subcategoriesWithProducts = [
        {
          _id: category._id,
          name: category.name,
          image: category.image || "",
          products: categoryProducts,
        },
      ];
    } else if (categoryProducts.length > 0 && subcategoriesWithProducts.length === 0) {
      // If the category has no subcategories but has products, include it in the response
      subcategoriesWithProducts = [
        {
          _id: category._id,
          name: category.name,
          image: category.image || "",
          products: categoryProducts,
        },
      ];
    }

    res.status(200).json({
      name: category.name,
      subcategories: subcategoriesWithProducts,
    });
  } catch (error) {
    console.error("Error fetching products and subcategories:", error);
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
