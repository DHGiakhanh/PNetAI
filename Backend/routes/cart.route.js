const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const {
    recalculateCartTotal,
    removeMissingProductsFromCart,
} = require("../utils/cart");

const router = express.Router();

// Get user cart
router.get('/', verifyToken, async (req, res) => {
    try {
        let cart = await db.Cart.findOne({ user: req.userId })
            .populate('items.product');
        
        if (!cart) {
            cart = new db.Cart({ user: req.userId, items: [] });
            await cart.save();
        }

        cart = await removeMissingProductsFromCart(cart);
        
        res.status(200).json({ cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add item to cart
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        const product = await db.Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
        }
        
        let cart = await db.Cart.findOne({ user: req.userId });
        
        if (!cart) {
            cart = new db.Cart({ user: req.userId, items: [] });
        }
        
        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                price: product.price
            });
        }
        
        // Calculate total
        recalculateCartTotal(cart);
        
        cart.updatedAt = Date.now();
        await cart.save();
        
        await cart.populate('items.product');
        cart = await removeMissingProductsFromCart(cart);
        
        res.status(200).json({ message: "Item added to cart", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update cart item quantity
router.put('/update/:productId', verifyToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        let cart = await db.Cart.findOne({ user: req.userId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        const item = cart.items.find(
            item => item.product.toString() === req.params.productId
        );
        
        if (!item) {
            return res.status(404).json({ message: "Item not found in cart" });
        }
        
        const product = await db.Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
        }
        
        item.quantity = quantity;
        
        // Calculate total
        recalculateCartTotal(cart);
        
        cart.updatedAt = Date.now();
        await cart.save();
        
        await cart.populate('items.product');
        cart = await removeMissingProductsFromCart(cart);
        
        res.status(200).json({ message: "Cart updated", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:productId', verifyToken, async (req, res) => {
    try {
        let cart = await db.Cart.findOne({ user: req.userId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );
        
        // Calculate total
        recalculateCartTotal(cart);
        
        cart.updatedAt = Date.now();
        await cart.save();
        
        await cart.populate('items.product');
        cart = await removeMissingProductsFromCart(cart);
        
        res.status(200).json({ message: "Item removed from cart", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clear cart
router.delete('/clear', verifyToken, async (req, res) => {
    try {
        const cart = await db.Cart.findOne({ user: req.userId });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        cart.items = [];
        cart.totalAmount = 0;
        cart.updatedAt = Date.now();
        await cart.save();
        
        res.status(200).json({ message: "Cart cleared", cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
