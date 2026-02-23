const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Get all products with filters and search
router.get('/', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
        
        let query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            query.category = category;
        }
        
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        
        let sortOption = {};
        if (sort === 'price-asc') sortOption.price = 1;
        else if (sort === 'price-desc') sortOption.price = -1;
        else if (sort === 'newest') sortOption.createdAt = -1;
        else if (sort === 'popular') sortOption.totalReviews = -1;
        
        const skip = (page - 1) * limit;
        
        const products = await db.Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));
            
        const total = await db.Product.countDocuments(query);
        
        res.status(200).json({
            products,
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

// Get hot products
router.get('/hot', async (req, res) => {
    try {
        const products = await db.Product.find({ isHot: true }).limit(8);
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get recommended products
router.get('/recommended', async (req, res) => {
    try {
        const products = await db.Product.find({ isRecommended: true }).limit(8);
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get latest products
router.get('/latest', async (req, res) => {
    try {
        const products = await db.Product.find().sort({ createdAt: -1 }).limit(8);
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await db.Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create product (Admin only)
router.post('/', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const product = new db.Product(req.body);
        await product.save();
        
        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product (Admin only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const product = await db.Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete product (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const product = await db.Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
