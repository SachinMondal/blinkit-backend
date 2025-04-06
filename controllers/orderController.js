const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const OrderItem=require("../models/OrderItemModel");
const Product = require("../models/productModel");


const createNewOrder = async (req, res) => {
    try {
      const userId = req.user._id;
      const { cartItems, shippingAddress } = req.body;
  
      if (!cartItems || !cartItems.cartItems || cartItems.cartItems.length === 0) {
        return res.status(400).json({ message: "Cart items cannot be empty." });
      }
  
      if (!shippingAddress || !shippingAddress._id) {
        return res.status(400).json({ message: "Shipping address is required." });
      }
  
      const cartItemsArray = cartItems.cartItems;
  
      // ✅ Step 1: Validate product availability
      const productIds = cartItemsArray.map(item => item.product?._id).filter(Boolean);
      const products = await Product.find({ _id: { $in: productIds } });
  
      if (products.length !== cartItemsArray.length) {
        return res.status(400).json({ message: "One or more products are unavailable." });
      }
  
      // ✅ Step 2: Create order (without items)
      const newOrder = new Order({
        user: userId,
        shippingAddress: shippingAddress._id,
        totalCartAmount: cartItems.totalCartAmount,
        totalCartDiscountAmount: cartItems.totalCartDiscountAmount,
        totalCartDiscountedPrice: cartItems.totalCartDiscountedPrice,
        totalItems: cartItems.totalCartSize,
      });
  
      const savedOrder = await newOrder.save();
  
      // ✅ Step 3: Create order items linked to order
      const orderItems = cartItemsArray.map(item => ({
        orderId: savedOrder._id,
        productId: item.product._id,
        quantity: item.quantity,
        variantDetails: item.variantDetails,
        subtotalPrice: item.subtotalPrice,
        subtotalDiscountedPrice: item.subtotalDiscountedPrice,
        discountAmount: item.discountAmount,
      }));
  
      const savedOrderItems = await OrderItem.insertMany(orderItems);
  
      // ✅ Step 4: Update order with orderItems reference
      savedOrder.orderItems = savedOrderItems.map(item => item._id);
      await savedOrder.save();
  
      // ✅ Step 5: Send response
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: savedOrder,
      });
  
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        success: false,
        message: "Error creating order",
        error: error.message,
      });
    }
  };
  
const getUserOrders = async (req, res) => {
    try {
      const userId = req.user._id;
      const orders = await Order.find({ user: userId })
        .populate("shippingAddress")
        .sort({ createdAt: -1 })
        .lean();
  
      const orderIds = orders.map(order => order._id);
  
      // Get all order items related to those orders
      const orderItems = await OrderItem.find({ orderId: { $in: orderIds } })
      .populate({
        path: "productId",
        populate: {
          path: "variants"
        }
      })
      .lean();

      const orderMap = {};
      orders.forEach(order => {
        orderMap[order._id.toString()] = {
          _id: order._id,
          totalCartAmount: order.totalCartAmount,
          totalCartDiscountAmount: order.totalCartDiscountAmount,
          totalCartDiscountedPrice: order.totalCartDiscountedPrice,
          totalItems: order.totalItems,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress,
          deliveryTime: order.deliveryTime,
          orderItems: []
        };
      });
  
      // Push each item to its respective order
      orderItems.forEach(item => {
        const orderIdStr = item.orderId.toString();
        if (orderMap[orderIdStr]) {
          orderMap[orderIdStr].orderItems.push(item);
        }
      });
  
      const result = Object.values(orderMap);
  
      res.status(200).json({ success: true, data: result });
    } catch (error) {
  
      res.status(500).json({
        message: "Error fetching user orders",
        error: error.message,
      });
    }
  };
  
const getAllOrdersForAdmin = async (req, res) => {  
    try {
      const orders = await Order.find()
        .populate("user", "name mobileNo")
        .populate("shippingAddress")
        .sort({ createdAt: -1 })
        .lean();
  
      const orderIds = orders.map(order => order._id);
      const orderItems = await OrderItem.find({ orderId: { $in: orderIds } })
        .populate({
          path: "productId",
          populate: {
            path: "variants"
          }
        })
        .lean();
  
      const orderMap = {};
      orders.forEach(order => {
        orderMap[order._id.toString()] = {
          _id: order._id,
          user: order.user,
          totalCartAmount: order.totalCartAmount,
          totalCartDiscountAmount: order.totalCartDiscountAmount,
          totalCartDiscountedPrice: order.totalCartDiscountedPrice,
          totalItems: order.totalItems,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress,
          deliveryTime: order.deliveryTime,
          orderItems: []
        };
      });
  
    
      orderItems.forEach(item => {
        const orderIdStr = item.orderId.toString();
        if (orderMap[orderIdStr]) {
          orderMap[orderIdStr].orderItems.push(item);
        }
      });
  
      const result = Object.values(orderMap);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching orders for admin:", error);
      res.status(500).json({
        message: "Error fetching orders for admin",
        error: error.message,
      });
    }
};

const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateFields = req.body;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("orderItems");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name mobileNo")
      .populate("shippingAddress")
      .populate({
        path: "orderItems",
        populate: {
          path: "productId",
          model: "Product", 
        },
      });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};








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






module.exports = {
    createNewOrder,
    updateOrder,
    deleteOrder,
    getUserOrders,
    getAllOrdersForAdmin,
    getOrderById
};
