const Category = require("../models/categoryModel");
const Product=require("../models/productModel")
const {uploadImage}=require("../utils/uploadImage");
const cloudinary = require("../config/Cloudinary");
const Variant=require("../models/VariantModel");
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
      newArrivals,
      isSale,
      isFeatured,
      isBestseller
    } = req.fields;


    let imageUrl = "";

    if (req.files && req.files.image) {
      imageUrl = await uploadImage(req.files.image.path);
    }

    
    const tagsArray = tags ? tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

   
    const parseBoolean = (value) => !!(value && (value === "on" || value === "true" || value === true));

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
      newArrivals: parseBoolean(newArrivals),
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
      newArrivals,
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


    const currentCategory = await Category.findById(id);
    if (!currentCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const isDiscountChanged =
      discountPercentage &&
      Number(discountPercentage) !== currentCategory.discountPercentage;

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
        newArrivals: parseBoolean(newArrivals),
        isSale: parseBoolean(isSale),
        isFeatured: parseBoolean(isFeatured),
        isBestseller: parseBoolean(isBestseller),
        ...(imageUrl && { image: imageUrl })
      },
      { new: true, runValidators: true }
    );
    if (isDiscountChanged) {
      const products = await Product.find({ category: updatedCategory._id }).select("_id");
      const productIds = products.map(p => p._id);

      const variants = await Variant.find({ product: { $in: productIds } });
      const bulkOps = variants.map(variant => {
        const newCategoryDiscount = (variant.price * updatedCategory.discountPercentage) / 100;
        return {
          updateOne: {
            filter: { _id: variant._id },
            update: {
              $set: {
                categoryDiscount: newCategoryDiscount,
                discountPrice: variant.price - newCategoryDiscount
              }
            }
          }
        };
      });

      if (bulkOps.length > 0) {
        await Variant.bulkWrite(bulkOps);
      }
    }

    res.status(200).json({ message: "Category updated successfully", updatedCategory });
  } catch (error) {
    
    return res.status(500).json({ message: error.message });
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
    
    return res.status(500).json({ message: "Error deleting category", error });
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
    return res.status(404).send({success:true,message:"Internal Server Error"});
  }
};

const getSubcategoriesWithProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
    const category = await Category.findById(categoryObjectId).lean();
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const categoryProducts = await Product.find({ category: categoryObjectId })
      .populate("variants")
      .lean();
    const subcategories = await Category.find({ parentCategory: categoryObjectId }).lean();

    const subcategoryIds = subcategories.map((sub) => sub._id);

    const subcategoryProducts = await Product.find({
      category: { $in: subcategoryIds },
    })
      .populate("variants")
      .lean();

    const subcategoriesWithProducts = subcategories.map((sub) => ({
      _id: sub._id,
      name: sub.name,
      image: sub.image || "",
      products: subcategoryProducts.filter(
        (product) => product.category.toString() === sub._id.toString()
      ),
    }));

    const combinedResponse = [
      {
        _id: category._id,
        name: category.name,
        image: category.image || "",
        products: categoryProducts,
      },
      ...subcategoriesWithProducts,
    ];

    res.status(200).json({
      name: category.name,
      subcategories: combinedResponse,
    });
  } catch (error) {
  
    return res.status(500).json({ error: "Internal Server Error" });
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
