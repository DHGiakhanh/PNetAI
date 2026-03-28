const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();
const isAdmin = (role) => role === "admin";

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await db.Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
        res.status(200).json({ categories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const category = await db.Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        res.status(200).json({ category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create category (Admin only)
router.post('/', verifyToken, async (req, res) => {
    try {
        if (!isAdmin(req.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const category = new db.Category(req.body);
        await category.save();
        
        res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update category (Admin only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        if (!isAdmin(req.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const category = await db.Category.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        res.status(200).json({ message: "Category updated successfully", category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete category (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (!isAdmin(req.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const category = await db.Category.findByIdAndDelete(req.params.id);
        
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
