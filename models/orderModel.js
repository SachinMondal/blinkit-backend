const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "addresses",
    required: true,
  },
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem", 
    },
  ],
  totalCartAmount: {
    type: Number,
    required: true,
  },
  totalCartDiscountAmount: {
    type: Number,
    required: true,
  },
  totalCartDiscountedPrice: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  deliveryTime:{
    type:String,
    default:"Pending"
  },
  orderStatus: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "SHIPPED", "DELIVERED", "CANCEL", "REJECT"],
    default: "PENDING",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
