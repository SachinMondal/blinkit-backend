const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const CartItem = require("../models/CartItemModel");

const addToCart = async (req, res) => {
    const userId = req.user._id;
    try {
      const { productId, variantIndex, count } = req.body;
  
      if (!productId || variantIndex === undefined || count === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      const product = await Product.findById(productId).populate("variants");
      if (!product) return res.status(404).json({ message: "Product not found" });
  
      if (variantIndex < 0 || variantIndex >= product.variants.length) {
        return res.status(400).json({ message: "Invalid variant index" });
      }
  
      const selectedVariant = product.variants[variantIndex];
      if (!selectedVariant || selectedVariant.price === undefined || selectedVariant.discountPrice === undefined) {
        return res.status(400).json({ message: "Invalid variant details" });
      }
  
      if (count > product.stock) {
        return res.status(400).json({ message: "Requested quantity exceeds stock availability" });
      }
  
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({ user: userId, cartItems: [] });
        await cart.save();
      }
  
      let cartItem = await CartItem.findOne({
        cart: cart._id,
        product: productId,
        variantIndex,
      });
  
      if (cartItem) {
        cartItem.quantity = count;
        cartItem.subtotalPrice = count * selectedVariant.price;
        cartItem.subtotalDiscountedPrice = count * selectedVariant.discountPrice;
        cartItem.discountAmount = count * (selectedVariant.price - selectedVariant.discountPrice);
      } else {
        cartItem = new CartItem({
          cart: cart._id,
          user: userId,
          product: productId,
          variantIndex,
          variantDetails: {
            qty: selectedVariant.qty || 0,
            unit: selectedVariant.unit || "unit",
            price: selectedVariant.price || 0,
            discountPrice: selectedVariant.discountPrice || 0,
          },
          quantity: count,
          subtotalPrice: count * selectedVariant.price,
          subtotalDiscountedPrice: count * selectedVariant.discountPrice,
          discountAmount: count * (selectedVariant.price - selectedVariant.discountPrice),
        });
  
        await cartItem.save();
        cart.cartItems.push(cartItem._id);
      }
  
      await cartItem.save();
  
      const cartItems = await CartItem.find({ cart: cart._id });
  
      cart.totalCartSize = cartItems.length;
      cart.totalCartAmount = cartItems.reduce((acc, item) => acc + item.subtotalPrice, 0);
      cart.totalCartDiscountedPrice = cartItems.reduce((acc, item) => acc + item.subtotalDiscountedPrice, 0);
      cart.totalCartDiscountAmount = cart.totalCartAmount - cart.totalCartDiscountedPrice;
  
      await cart.save();
  
      return res.status(200).json({ success: true, data: cart });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
  

  const getCart = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: "cartItems",
          populate: [
            {
              path: "product",
              model: "Product",
            },
            {
              path: "variantDetails",
              model: "Variant", 
            },
          ],
        });
  
      if (!cart || cart.cartItems.length === 0) {
        return res.status(404).json({ message: "Cart is empty" });
      }

      return res.status(200).json({ success: true, data: cart });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  };
  

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const { productId, variantIndex } = req.body;
        const userId = req.user._id;
        let cart = await Cart.findOne({ user: userId }).populate("cartItems");
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        let cartItemId = null;
        const normalizedProductId = productId.toString();
        const normalizedVariantIndex = Number(variantIndex);
        const itemIndex = cart.cartItems.findIndex((item, index) => {
            const productMatch = item?.product?.toString() === normalizedProductId;
            const variantMatch = item.variantIndex === normalizedVariantIndex;
            if (productMatch && variantMatch) {
                cartItemId = item._id; 
                return true;
            }
            return false;
        });


        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        
        cart.cartItems.splice(itemIndex, 1);

        
        if (cartItemId) {
            await CartItem.deleteOne({ _id: cartItemId });
        }

        
        if (cart.cartItems.length === 0) {
            await Cart.deleteOne({ user: userId });
            return res.status(200).json({ success: true, data:[]});
        }

        
        cart.totalCartSize = cart.cartItems.length;
        cart.totalCartAmount = cart.cartItems.reduce((acc, item) => acc + (item.subtotalPrice || 0), 0);
        cart.totalCartDiscountedPrice = cart.cartItems.reduce((acc, item) => acc + (item.subtotalDiscountedPrice || 0), 0);
        cart.totalCartDiscountAmount = cart.totalCartAmount - cart.totalCartDiscountedPrice;

        
        await cart.save();
        res.status(200).json({ success: true, message: "Item removed", cart });
    } catch (err) {
        
        res.status(500).json({ success: false, message: err.message });
    }
};

  

// Empty cart after checkout
const emptyCart = async (req, res) => {
    const userId = req.user._id;
    try {
    
      const cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
  
    
      await CartItem.deleteMany({ cart: cart._id });
  
   
      await Cart.findByIdAndDelete(cart._id);
  
      res.status(200).json({ message: "Cart emptied successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  

module.exports = { addToCart, getCart, removeFromCart, emptyCart };
