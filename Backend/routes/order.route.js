const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Create order (Checkout)
router.post('/checkout', verifyToken, async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;
        
        const cart = await db.Cart.findOne({ user: req.userId })
            .populate('items.product');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        
        // Check stock availability
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${item.product.name}` 
                });
            }
        }
        
        // Create order
        const order = new db.Order({
            user: req.userId,
            items: cart.items.map(item => ({
                product: item.product._id,
                name: item.product.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: cart.totalAmount,
            shippingAddress,
            paymentMethod: paymentMethod || 'COD'
        });
        
        await order.save();
        
        // Update product stock
        for (const item of cart.items) {
            await db.Product.findByIdAndUpdate(item.product._id, {
                $inc: { stock: -item.quantity }
            });
        }
        
        // Clear cart
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();
        
        res.status(201).json({ 
            message: "Order created successfully", 
            order 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user order history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const orders = await db.Order.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .populate('items.product');
        
        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const order = await db.Order.findById(req.params.id)
            .populate('items.product');
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        if (order.user.toString() !== req.userId && req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel order
router.put('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const order = await db.Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        if (order.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        if (order.status === 'cancelled') {
            return res.status(400).json({ message: "Order already cancelled" });
        }
        
        if (order.status === 'delivered') {
            return res.status(400).json({ message: "Cannot cancel delivered order" });
        }
        
        order.status = 'cancelled';
        order.updatedAt = Date.now();
        await order.save();
        
        // Restore product stock
        for (const item of order.items) {
            await db.Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }
        
        res.status(200).json({ message: "Order cancelled successfully", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (Admin only)
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const { status } = req.body;
        
        const order = await db.Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        res.status(200).json({ message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders (Admin only)
router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const { status, page = 1, limit = 20 } = req.query;
        
        let query = {};
        if (status) {
            query.status = status;
        }
        
        const skip = (page - 1) * limit;
        
        const orders = await db.Order.find(query)
            .populate('user', 'name email')
            .populate('items.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
            
        const total = await db.Order.countDocuments(query);
        
        res.status(200).json({
            orders,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
