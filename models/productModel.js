const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    categoryName: { type: String, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    image: { type: String, default: "" },
    weight: { type: String, trim: true },
    stock: { type: Number, default: 0 },
    type: { type: String, enum: ["veg", "nonveg"], required: true },
    size: { type: String, trim: true },
    packerDetails: { type: String, trim: true },
    brand: { type: String, trim: true },
    variantSize: { type: String, trim: true },
    returnPolicy: { type: String, trim: true },
    manufacturerAddress: { type: String, trim: true },
    marketerAddress: { type: String, trim: true },
    countryOfOrigin: { type: String, trim: true },
    customerCare: { type: String, trim: true },
    seller: { type: String, trim: true },
    disclaimer: { type: String, trim: true },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Variant" }],
    details: [
      {
        key: { type: String, trim: true },
        value: { type: String,  trim: true },
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
