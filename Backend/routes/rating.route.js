const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Get ratings for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const ratings = await db.Rating.find({ product: req.params.productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ ratings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create rating (requires login)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { product, rating, comment } = req.body;
        
        // Check if user already rated this product
        const existingRating = await db.Rating.findOne({ 
            product, 
            user: req.userId 
        });
        
        if (existingRating) {
            return res.status(400).json({ message: "You already rated this product" });
        }
        
        const newRating = new db.Rating({
            product,
            user: req.userId,
            rating,
            comment
        });
        
        await newRating.save();
        
        // Update product average rating
        const ratings = await db.Rating.find({ product });
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        await db.Product.findByIdAndUpdate(product, {
            averageRating: avgRating,
            totalReviews: ratings.length
        });
        
        res.status(201).json({ message: "Rating created successfully", rating: newRating });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update rating
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const rating = await db.Rating.findById(req.params.id);
        
        if (!rating) {
            return res.status(404).json({ message: "Rating not found" });
        }
        
        if (rating.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        rating.rating = req.body.rating || rating.rating;
        rating.comment = req.body.comment || rating.comment;
        await rating.save();
        
        // Update product average rating
        const ratings = await db.Rating.find({ product: rating.product });
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        await db.Product.findByIdAndUpdate(rating.product, {
            averageRating: avgRating
        });
        
        res.status(200).json({ message: "Rating updated successfully", rating });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete rating
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const rating = await db.Rating.findById(req.params.id);
        
        if (!rating) {
            return res.status(404).json({ message: "Rating not found" });
        }
        
        if (rating.user.toString() !== req.userId && req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const productId = rating.product;
        await db.Rating.findByIdAndDelete(req.params.id);
        
        // Update product average rating
        const ratings = await db.Rating.find({ product: productId });
        const avgRating = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
            : 0;
        
        await db.Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            totalReviews: ratings.length
        });
        
        res.status(200).json({ message: "Rating deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
