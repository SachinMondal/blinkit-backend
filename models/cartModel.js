const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CartItem",
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
    categoryDiscount:{type:Number},
    productDiscount:{type:Number},
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
