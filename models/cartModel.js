const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    cartItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variantIndex: { type: Number, required: true }, // Store the selected variant index
        variantDetails: {
          qty: { type: String, required: true },
          unit: { type: String, required: true },
          price: { type: Number, required: true },
          discountPrice: { type: Number, required: true },
        },
        quantity: { type: Number, required: true, min: 1 },
        subtotalPrice: { type: Number, required: true }, // (quantity * price)
        subtotalDiscountedPrice: { type: Number, required: true }, // (quantity * discountPrice)
        discountAmount: { type: Number, required: true }, // subtotalPrice - subtotalDiscountedPrice
      },
    ],
    totalCartSize: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCartAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCartDiscountedPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCartDiscountAmount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;