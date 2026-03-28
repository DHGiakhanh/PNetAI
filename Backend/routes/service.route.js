const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();
const isServiceProvider = (role) => role === "service_provider" || role === "shop";

// Get all services with filters and search
router.get('/', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, location, sort, page = 1, limit = 12 } = req.query;
        
        let query = { isAvailable: true };
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            query.category = category;
        }
        
        if (minPrice || maxPrice) {
            query.basePrice = {};
            if (minPrice) query.basePrice.$gte = Number(minPrice);
            if (maxPrice) query.basePrice.$lte = Number(maxPrice);
        }
        
        if (location) {
            query['location.city'] = { $regex: location, $options: 'i' };
        }
        
        let sortOption = {};
        if (sort === 'price-asc') sortOption.basePrice = 1;
        else if (sort === 'price-desc') sortOption.basePrice = -1;
        else if (sort === 'newest') sortOption.createdAt = -1;
        else if (sort === 'popular') sortOption.totalReviews = -1;
        else if (sort === 'rating') sortOption.averageRating = -1;
        
        const skip = (page - 1) * limit;
        
        const services = await db.Service.find(query)
            .populate('providerId', 'name email')
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit));
            
        const total = await db.Service.countDocuments(query);
        
        res.status(200).json({
            services,
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

// Get popular services
router.get('/popular', async (req, res) => {
    try {
        const services = await db.Service.find({ isPopular: true, isAvailable: true })
            .populate('providerId', 'name email')
            .limit(8);
        res.status(200).json({ services });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
    try {
        const services = await db.Service.find({ 
            category: req.params.category, 
            isAvailable: true 
        })
        .populate('providerId', 'name email')
        .limit(8);
        res.status(200).json({ services });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get latest services
router.get('/latest', async (req, res) => {
    try {
        const services = await db.Service.find({ isAvailable: true })
            .populate('providerId', 'name email')
            .sort({ createdAt: -1 })
            .limit(8);
        res.status(200).json({ services });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get service by ID
router.get('/:id', async (req, res) => {
    try {
        const service = await db.Service.findById(req.params.id)
            .populate('providerId', 'name email phone');
        
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        
        res.status(200).json({ service });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create service (Service Provider only)
router.post('/', verifyToken, async (req, res) => {
    try {
        if (!isServiceProvider(req.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const serviceData = {
            ...req.body,
            providerId: req.userId
        };
        
        const service = new db.Service(serviceData);
        await service.save();
        
        res.status(201).json({ message: "Service created successfully", service });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update service (Service Provider owner only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const service = await db.Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        
        if (!isServiceProvider(req.role) || service.providerId.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const updatedService = await db.Service.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        res.status(200).json({ message: "Service updated successfully", service: updatedService });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete service (Service Provider owner only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const service = await db.Service.findById(req.params.id);
        
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        
        if (!isServiceProvider(req.role) || service.providerId.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        await db.Service.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
