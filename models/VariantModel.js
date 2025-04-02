const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, // Reference to the product
    qty: { type: String, required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

const Variant = mongoose.model("Variant", variantSchema);
module.exports = Variant;
