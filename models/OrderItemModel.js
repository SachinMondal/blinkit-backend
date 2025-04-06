const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    variantDetails: {
        qty: String,
        unit: String,
        price: Number,
        discountPrice: Number
    },
    subtotalPrice: {
        type: Number,
        required: true
    },
    subtotalDiscountedPrice: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    }
});

const OrderItem = mongoose.model("OrderItem", orderItemSchema);
module.exports = OrderItem;
