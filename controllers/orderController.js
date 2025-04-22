const Order = require("../models/orderModel");
const OrderItem=require("../models/OrderItemModel");
const Product = require("../models/productModel");
const { sendRejectionEmail,sendAcceptanceEmail } = require("../utils/mailHandler");

const createNewOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cartItems, shippingAddress } = req.body;
    if (!cartItems || !Array.isArray(cartItems.cartItems) || cartItems.cartItems.length === 0) {
      return res.status(400).json({ message: "Cart items cannot be empty." });
    }

    if (!shippingAddress || !shippingAddress._id) {
      return res.status(400).json({ message: "Shipping address is required." });
    }

    const cartItemsArray = cartItems.cartItems;

   
    const productIds = cartItemsArray.map(item => item.product?._id).filter(Boolean);
    const uniqueProductIds = [...new Set(productIds.map(id => id.toString()))];

    const products = await Product.find({ _id: { $in: uniqueProductIds } })

    if (products.length !== uniqueProductIds.length) {
      return res.status(400).json({ message: "One or more products are unavailable." });
    }

    const newOrder = new Order({
      user: userId,
      shippingAddress: shippingAddress._id,
      totalCartAmount: cartItems.totalCartAmount,
      totalCartDiscountAmount: cartItems.totalCartDiscountAmount,
      totalCartDiscountedPrice: cartItems.totalCartDiscountedPrice,
      totalItems: cartItems.totalCartSize,
      discountedTotal: cartItems.discountedTotal,
      handlingCharge: cartItems.handlingCharge,
      deliveryCharge: cartItems.deliveryCharge,
      productDiscount:cartItems.productDiscount,
      categoryDiscount:cartItems.categoryDiscount,
      finalPrice: cartItems.finalAmount,
    });
    const savedOrder = await newOrder.save();

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

    savedOrder.orderItems = savedOrderItems.map(item => item._id);
    await savedOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });

  } catch (error) {
    
    return res.status(500).json({
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
        discountedTotal: order.discountedTotal,
        handlingCharge: order.handlingCharge,
        deliveryCharge: order.deliveryCharge,
        finalPrice: order.finalPrice,
        totalItems: order.totalItems,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        deliveryTime: order.deliveryTime,
        categoryDiscount:order.categoryDiscount,
        productDiscount:order.productDiscount,
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
          categoryDiscount:order.categoryDiscount,
          productDiscount:order.productDiscount,
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
      
      return res.status(500).json({
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
    )
      .populate({
        path: "orderItems",
        populate: [
          { path: "productId" },
          { path: "variantDetails" }
        ]
      })
      .populate("user");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (
      updateFields.orderStatus === "ACCEPTED" &&
      updatedOrder.user?.email
    ) {
      await sendAcceptanceEmail(updatedOrder.user.email, updatedOrder);
    }
    

    if (
      updateFields.orderStatus === "REJECT" &&
      updateFields.rejectReason &&
      updatedOrder.user?.email
    ) {
      await sendRejectionEmail(
        updatedOrder.user.email,
        updatedOrder,
        updateFields.rejectReason
      );
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name mobileNo location locationPin")
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
