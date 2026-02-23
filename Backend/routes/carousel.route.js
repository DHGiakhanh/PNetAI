const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Get all active carousels
router.get('/', async (req, res) => {
    try {
        const carousels = await db.Carousel.find({ isActive: true })
            .sort({ order: 1 });
        
        res.status(200).json({ carousels });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all carousels (Admin only)
router.get('/all', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const carousels = await db.Carousel.find().sort({ order: 1 });
        
        res.status(200).json({ carousels });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create carousel (Admin only)
router.post('/', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const carousel = new db.Carousel(req.body);
        await carousel.save();
        
        res.status(201).json({ message: "Carousel created successfully", carousel });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update carousel (Admin only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const carousel = await db.Carousel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!carousel) {
            return res.status(404).json({ message: "Carousel not found" });
        }
        
        res.status(200).json({ message: "Carousel updated successfully", carousel });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete carousel (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const carousel = await db.Carousel.findByIdAndDelete(req.params.id);
        
        if (!carousel) {
            return res.status(404).json({ message: "Carousel not found" });
        }
        
        res.status(200).json({ message: "Carousel deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
