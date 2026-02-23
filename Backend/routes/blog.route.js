const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Get all blogs with filters
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (page - 1) * limit;
        
        const blogs = await db.Blog.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
            
        const total = await db.Blog.countDocuments(query);
        
        res.status(200).json({
            blogs,
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

// Get hot posts
router.get('/hot', async (req, res) => {
    try {
        const blogs = await db.Blog.find({ isHot: true })
            .populate('author', 'name')
            .sort({ views: -1 })
            .limit(5);
            
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get latest posts
router.get('/latest', async (req, res) => {
    try {
        const blogs = await db.Blog.find()
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .limit(5);
            
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get blog by ID
router.get('/:id', async (req, res) => {
    try {
        const blog = await db.Blog.findById(req.params.id)
            .populate('author', 'name email');
        
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        
        // Increment views
        blog.views += 1;
        await blog.save();
        
        res.status(200).json({ blog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create blog (Admin only)
router.post('/', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const blog = new db.Blog({
            ...req.body,
            author: req.userId
        });
        
        await blog.save();
        
        res.status(201).json({ message: "Blog created successfully", blog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update blog (Admin only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const blog = await db.Blog.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        
        res.status(200).json({ message: "Blog updated successfully", blog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete blog (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const blog = await db.Blog.findByIdAndDelete(req.params.id);
        
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        
        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
