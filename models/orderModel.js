const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cartItems: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
               
            },
            quantity: {
                type: Number,
              
            },
            variantDetails: {
                qty: String,
                unit: String,
                price: Number,
                discountPrice: Number
            },
            subtotalPrice: {
                type: Number,
              
            },
            subtotalDiscountedPrice: {
                type: Number,
           
            },
            discountAmount: {
                type: Number,
   
            }
        }
    ],
    totalCartAmount: {
        type: Number,
        required: true
    },
    totalCartDiscountAmount: {
        type: Number,
        required: true
    },
    totalCartDiscountedPrice: {
        type: Number,
        required: true
    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "addresses",
        required: true
    },
    orderStatus: {
        type: String,
        enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED","REJECTED"],
        default: "PENDING"
    },
    totalItems: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model("orders", orderSchema);
module.exports = Order;
