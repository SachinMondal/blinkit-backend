const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    weight: { type: String },
    shelfLife: { type: String },
    netWeight: { type: String },
    type: { type: String, enum: ["veg", "nonveg"], required: true },
    brand: { type: String },
    size: { type: String },
    
    // New feature: multiple price and quantity options
    variants: [
      {
        qty: { type: String, required: true },
        unit:{type: String, required: true},
        price: { type: Number, required: true },
        discountPrice: { type: Number, required: true },
      }
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
