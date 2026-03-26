const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Middleware to check admin role
const isAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
};

// Get all settings (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        const settings = await db.SystemSetting.find(query)
            .populate('updatedBy', 'name email')
            .sort({ category: 1, key: 1 });
            
        res.status(200).json({ settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get public settings (accessible by all authenticated users)
router.get('/public', verifyToken, async (req, res) => {
    try {
        const settings = await db.SystemSetting.find({ isPublic: true })
            .select('key value description category type')
            .sort({ category: 1, key: 1 });
            
        res.status(200).json({ settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get setting by key (Admin only)
router.get('/:key', verifyToken, isAdmin, async (req, res) => {
    try {
        const setting = await db.SystemSetting.findOne({ key: req.params.key })
            .populate('updatedBy', 'name email');
            
        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }
        
        res.status(200).json({ setting });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create or update setting (Admin only)
router.put('/:key', verifyToken, isAdmin, async (req, res) => {
    try {
        const { value, description, category, type, isPublic } = req.body;
        
        if (value === undefined) {
            return res.status(400).json({ message: "Value is required" });
        }
        
        const setting = await db.SystemSetting.findOneAndUpdate(
            { key: req.params.key },
            {
                value,
                description,
                category: category || 'general',
                type: type || typeof value,
                isPublic: isPublic || false,
                updatedBy: req.userId,
                updatedAt: Date.now()
            },
            { upsert: true, new: true }
        ).populate('updatedBy', 'name email');
        
        res.status(200).json({ 
            message: "Setting updated successfully", 
            setting 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete setting (Admin only)
router.delete('/:key', verifyToken, isAdmin, async (req, res) => {
    try {
        const setting = await db.SystemSetting.findOneAndDelete({ key: req.params.key });
        
        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }
        
        res.status(200).json({ message: "Setting deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Initialize default settings
router.post('/initialize', verifyToken, isAdmin, async (req, res) => {
    try {
        const defaultSettings = [
            {
                key: 'platform_commission_rate',
                value: 0.10,
                description: 'Platform commission rate for transactions (10% = 0.10)',
                category: 'commission',
                type: 'number',
                isPublic: false
            },
            {
                key: 'min_withdrawal_amount',
                value: 50,
                description: 'Minimum withdrawal amount for partners',
                category: 'commission',
                type: 'number',
                isPublic: true
            },
            {
                key: 'max_login_attempts',
                value: 5,
                description: 'Maximum failed login attempts before account lock',
                category: 'security',
                type: 'number',
                isPublic: false
            },
            {
                key: 'session_timeout_minutes',
                value: 30,
                description: 'User session timeout in minutes',
                category: 'security',
                type: 'number',
                isPublic: false
            },
            {
                key: 'enable_email_verification',
                value: true,
                description: 'Require email verification for new accounts',
                category: 'security',
                type: 'boolean',
                isPublic: false
            },
            {
                key: 'payment_gateways',
                value: ['stripe', 'paypal', 'cod'],
                description: 'Available payment gateways',
                category: 'payment',
                type: 'array',
                isPublic: true
            },
            {
                key: 'maintenance_mode',
                value: false,
                description: 'Put the platform in maintenance mode',
                category: 'general',
                type: 'boolean',
                isPublic: true
            },
            {
                key: 'platform_version',
                value: '1.0.0',
                description: 'Current platform version',
                category: 'general',
                type: 'string',
                isPublic: true
            }
        ];
        
        const operations = defaultSettings.map(setting => ({
            updateOne: {
                filter: { key: setting.key },
                update: { 
                    ...setting, 
                    updatedBy: req.userId 
                },
                upsert: true
            }
        }));
        
        await db.SystemSetting.bulkWrite(operations);
        
        res.status(201).json({ 
            message: "Default settings initialized successfully" 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
