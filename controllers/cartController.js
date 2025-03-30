const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const addToCart = async (req, res) => {
    const userId = req.user._id;
    try {
        const { productId, variantIndex, quantity,count } = req.body;
        console.log(req.body);

        if (!userId || !productId || variantIndex === undefined || !quantity) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Validate variantIndex
        if (variantIndex < 0 || variantIndex >= product.variants.length) {
            return res.status(400).json({ message: "Invalid variant index" });
        }

        const selectedVariant = product.variants[variantIndex];

        // Check if requested quantity exceeds available stock
        if (quantity > selectedVariant.qty) {
            return res.status(400).json({ message: "Requested quantity exceeds stock availability" });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, cartItems: [] });
        }

        // Check if the same variant of the product already exists in the cart
        const existingItemIndex = cart.cartItems.findIndex(
            item => item.productId.equals(productId) && item.variantIndex === variantIndex
        );

        if (existingItemIndex > -1) {
            // Update existing cart item
            cart.cartItems[existingItemIndex].quantity += quantity;
            cart.cartItems[existingItemIndex].subtotalPrice =
                cart.cartItems[existingItemIndex].quantity * selectedVariant.price;
            cart.cartItems[existingItemIndex].subtotalDiscountedPrice =
                cart.cartItems[existingItemIndex].quantity * selectedVariant.discountPrice;
            cart.cartItems[existingItemIndex].discountAmount =
                cart.cartItems[existingItemIndex].subtotalPrice - cart.cartItems[existingItemIndex].subtotalDiscountedPrice;
        } else {
            // Add new item to the cart
            cart.cartItems.push({
                productId,
                variantIndex,
                count,
                variantDetails: {
                    qty: selectedVariant.qty,
                    unit: selectedVariant.unit,
                    price: selectedVariant.price,
                    discountPrice: selectedVariant.discountPrice,
                },
                quantity: quantity*count,
                subtotalPrice: quantity * selectedVariant.price,
                subtotalDiscountedPrice: quantity * selectedVariant.discountPrice,
                discountAmount: (quantity * selectedVariant.price) - (quantity * selectedVariant.discountPrice),
            });
        }

        // Recalculate total cart values
        cart.totalCartSize = cart.cartItems.length;
        cart.totalCartAmount = cart.cartItems.reduce((acc, item) => acc + item.subtotalPrice, 0);
        cart.totalCartDiscountedPrice = cart.cartItems.reduce((acc, item) => acc + item.subtotalDiscountedPrice, 0);
        cart.totalCartDiscountAmount = cart.totalCartAmount - cart.totalCartDiscountedPrice;

        await cart.save();
        res.status(200).json({ success: true, data: cart });
    } catch (err) {
        console.error("🔴 Error in addToCart:", err.stack);
        res.status(500).json({ message: err.message });
    }
};

const updateCartItem = async (req, res) => {
    const userId = req.user._id;
    try {
        const { productId, variantIndex, newQuantity } = req.body;

        if (!userId || !productId || variantIndex === undefined || newQuantity === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const cartItemIndex = cart.cartItems.findIndex(
            (item) => item.productId.equals(productId) && item.variantIndex === variantIndex
        );

        if (cartItemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const selectedVariant = product.variants[variantIndex];

        // Check if the new quantity exceeds stock availability
        if (newQuantity > selectedVariant.qty) {
            return res.status(400).json({ message: "Requested quantity exceeds stock availability" });
        }

        if (newQuantity <= 0) {
            // Remove item if quantity is reduced to 0
            cart.cartItems.splice(cartItemIndex, 1);
        } else {
            // Update the item's quantity and recalculate the subtotal
            cart.cartItems[cartItemIndex].quantity = newQuantity;
            cart.cartItems[cartItemIndex].subtotalPrice = newQuantity * selectedVariant.price;
            cart.cartItems[cartItemIndex].subtotalDiscountedPrice = newQuantity * selectedVariant.discountPrice;
            cart.cartItems[cartItemIndex].discountAmount =
                cart.cartItems[cartItemIndex].subtotalPrice - cart.cartItems[cartItemIndex].subtotalDiscountedPrice;
        }

        // Recalculate cart totals
        cart.totalCartSize = cart.cartItems.length;
        cart.totalCartAmount = cart.cartItems.reduce((acc, item) => acc + item.subtotalPrice, 0);
        cart.totalCartDiscountedPrice = cart.cartItems.reduce((acc, item) => acc + item.subtotalDiscountedPrice, 0);
        cart.totalCartDiscountAmount = cart.totalCartAmount - cart.totalCartDiscountedPrice;

        await cart.save();
        res.status(200).json({ success: true, data: cart });
    } catch (err) {
        console.error("🔴 Error in updateCartItem:", err);
        res.status(500).json({ message: err.message });
    }
};


// Get cart items
const getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ user: userId }).populate("cartItems.productId");
        if (!cart) return res.status(404).json({ message: "Cart is empty" });
        res.status(200).json({success: true, data:cart});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    const userId = req.user._id;
    try {
        const {productId } = req.body;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.cartItems = cart.cartItems.filter(item => !item.productId.equals(productId));
        cart.totalItem = cart.cartItems.length;
        cart.totalQuantity = cart.cartItems.reduce((acc, item) => acc + item.quantity, 0);
        cart.totalPrice = cart.cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
        await cart.save();
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Empty cart after checkout
const emptyCart = async (req, res) => {
    const userId = req.user._id;
    try {
        await Cart.findOneAndDelete({ user: userId });
        res.status(200).json({ message: "Cart emptied successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports =
    { addToCart, getCart, removeFromCart, emptyCart,updateCartItem };