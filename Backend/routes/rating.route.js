const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

async function recalculateProductRating(productId) {
    const ratings = await db.Rating.find({ product: productId });
    const totalReviews = ratings.length;
    const averageRating = totalReviews > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) / totalReviews
        : 0;

    await db.Product.findByIdAndUpdate(productId, {
        averageRating,
        totalReviews
    });
}

async function hasPurchasedOrder(userId, productId) {
    return db.Order.exists({
        user: userId,
        "items.product": productId,
        status: { $ne: "cancelled" },
        $or: [
            { paymentStatus: "paid" },
            {
                paymentMethod: "COD",
                status: { $in: ["processing", "shipped", "delivered"] },
            },
        ],
    });
}

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

// Get current user's rating for a product
router.get('/product/:productId/me', verifyToken, async (req, res) => {
    try {
        const rating = await db.Rating.findOne({
            product: req.params.productId,
            user: req.userId
        }).populate('user', 'name');

        res.status(200).json({ rating });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Check whether current user can review a product
router.get('/product/:productId/eligibility', verifyToken, async (req, res) => {
    try {
        const [purchaseRecord, existingRating] = await Promise.all([
            hasPurchasedOrder(req.userId, req.params.productId),
            db.Rating.findOne({
                product: req.params.productId,
                user: req.userId
            }).select('_id')
        ]);

        res.status(200).json({
            canReview: Boolean(purchaseRecord) && !existingRating,
            hasPurchased: Boolean(purchaseRecord),
            hasReviewed: Boolean(existingRating),
            ratingId: existingRating?._id || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create rating (requires login)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { product, rating, comment } = req.body;

        if (!product || typeof rating !== "number") {
            return res.status(400).json({ message: "Product and rating are required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const foundProduct = await db.Product.findById(product).select('_id');
        if (!foundProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        const purchaseRecord = await hasPurchasedOrder(req.userId, product);
        if (!purchaseRecord) {
            return res.status(403).json({
                message: "You can only review products from delivered orders"
            });
        }
        
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
            comment: typeof comment === "string" ? comment.trim() : ""
        });
        
        await newRating.save();
        await recalculateProductRating(product);
        
        const populatedRating = await db.Rating.findById(newRating._id).populate('user', 'name');

        res.status(201).json({ message: "Rating created successfully", rating: populatedRating });
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
        
        if (typeof req.body.rating === "number") {
            if (req.body.rating < 1 || req.body.rating > 5) {
                return res.status(400).json({ message: "Rating must be between 1 and 5" });
            }
            rating.rating = req.body.rating;
        }

        if (typeof req.body.comment === "string") {
            rating.comment = req.body.comment.trim();
        }

        rating.updatedAt = Date.now();
        await rating.save();
        await recalculateProductRating(rating.product);
        
        const populatedRating = await db.Rating.findById(rating._id).populate('user', 'name');

        res.status(200).json({ message: "Rating updated successfully", rating: populatedRating });
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
        await recalculateProductRating(productId);
        
        res.status(200).json({ message: "Rating deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
