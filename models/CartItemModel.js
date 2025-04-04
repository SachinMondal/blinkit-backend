const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema(
  {
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantIndex: {
      type: Number,
      required: true,
    },
    variantDetails: {
      qty: { type: String, required: true },
      unit: { type: String, required: true },
      price: { type: Number, required: true },
      discountPrice: { type: Number, required: true },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotalPrice: {
      type: Number,
      required: true, 
    },
    subtotalDiscountedPrice: {
      type: Number,
      required: true, 
    },
    discountAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const CartItem = mongoose.model("CartItem", CartItemSchema);
module.exports = CartItem;
