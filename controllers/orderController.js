const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Product = require("../models/productModel");

// Create New Order
const createNewOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { cartItems, shippingAddress } = req.body

        // Validate request body
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Cart items cannot be empty." });
        }
        if (!shippingAddress ) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        // Extract product IDs from cartItems
        const productIds = cartItems.cartItems.map(item => item.productId._id);
        console.log(productIds);
        const products = await Product.find({ _id: { $in: productIds } });
        console.log(products);

        // Create new order object
        const newOrder = new Order({
            user: userId,
            cartItems:products,
            shippingAddress,
            totalCartAmount:cartItems.totalCartAmount,
            totalCartDiscountAmount:cartItems.totalCartDiscountAmount,
            totalCartDiscountedPrice:cartItems.totalCartDiscountedPrice,
            totalItems: cartItems.totalCartSize
        });

        // Save to database
        const savedOrder = await newOrder.save();

        res.status(201).json({
            message: "Order created successfully",
            order: savedOrder
        });
    } catch (error) {
        console.error("Order Creation Error:", error.stack);
        res.status(500).json({ message: "Error creating order", error: error.message });
    }
};

// Get All Orders (Admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name mobileNo") // Ensure "user" is correct
            .populate("shippingAddress")
            .populate("cartItems.productId");

        res.status(200).json(orders);
    } catch (error) {
        console.error(error.stack);
        res.status(500).json({ message: "Error fetching orders", error });
    }
};


// Get Orders by Status (Admin)
const getOrderByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const orders = await Order.find({ orderStatus: status })
            .populate("user", "name email")
            .populate("shippingAddress")
            .populate("cartItems.productId");

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error });
    }
};

// Update Order (Admin)
const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const updateFields = req.body; // Get all fields to update

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No fields provided for update" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateFields }, // Dynamically update any field
            { new: true, runValidators: true } // Return updated doc and validate
        ).populate("cartItems.productId");

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        console.error("Error updating order:", error.stack);
        res.status(500).json({ message: "Error updating order", error });
    }
};



// Delete Order (Admin)
const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(orderId);

        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting order", error });
    }
};

// Get Orders for Logged-in User
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ user: userId })
            .populate("shippingAddress")
            .populate("cartItems.productId");

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user orders", error });
    }
};

// Get All Orders for Admin with Product Details
const getAllOrdersForAdmin = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name mobileNo")
            .populate("shippingAddress")
            .populate("cartItems.productId");

        res.status(200).json(orders);
    } catch (error) {
        console.error(error.stack);
        res.status(500).json({ message: "Error fetching orders for admin", error });
    }
};

const getOrderById=async (req,res)=>{
    try{
        const id=req.params.orderId;
        const order=await Order.findById(id).populate("user","name mobileNo").populate("shippingAddress").populate("cartItems.productId");
        if(!order){
            return res.status(404).json({ message: "Order not found" });
        }
        res.status(200).json({success:true,data:order});
    }catch(error){
        console.error(error.stack);
        res.status(500).json({ message: "Error fetching order", error });
    }
 };


module.exports = {
    createNewOrder,
    getAllOrders,
    getOrderByStatus,
    updateOrder,
    deleteOrder,
    getUserOrders,
    getAllOrdersForAdmin,
    getOrderById
};
