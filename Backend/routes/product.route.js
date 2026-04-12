const express = require("express");
const multer = require("multer");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { cloudinary } = require("../config/cloudinary");

const router = express.Router();
const isServiceProvider = (role) => role === "service_provider" || role === "shop";
const getProviderOnboardingStatus = (user) => {
    if (!isServiceProvider(user?.role)) return undefined;
    if (user.providerOnboardingStatus) return user.providerOnboardingStatus;
    return user.isVerified ? "pending_legal_submission" : "pending_sale_approval";
};
const canProviderPublish = (user) =>
    isServiceProvider(user?.role) && user.isVerified && getProviderOnboardingStatus(user) === "approved";
const ensureProviderCanPublish = async (req, res) => {
    const provider = await db.User.findById(req.userId).select("role isVerified providerOnboardingStatus");
    if (!provider || !isServiceProvider(provider.role)) {
        res.status(403).json({ message: "Access denied" });
        return null;
    }

    if (!canProviderPublish(provider)) {
        res.status(403).json({
            message: "Complete legal documents and wait for sale approval before publishing products/services.",
            code: "PROVIDER_NOT_READY",
            providerOnboardingStatus: getProviderOnboardingStatus(provider),
        });
        return null;
    }

    return provider;
};
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Get all products with filters and search
router.get('/', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort, providerId, page = 1, limit = 12 } = req.query;
        
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

        if (providerId) {
            query.providerId = providerId;
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
            .populate('providerId', 'name email')
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
        const product = await db.Product.findById(req.params.id).populate('providerId', 'name email');
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload product image (Service Provider only)
router.post('/upload-image', verifyToken, upload.single("image"), async (req, res) => {
    try {
        const provider = await ensureProviderCanPublish(req, res);
        if (!provider) return;

        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }

        if (!req.file.mimetype?.startsWith("image/")) {
            return res.status(400).json({ message: "Only image files are allowed" });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "pnetai/products",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        return res.status(200).json({
            message: "Product image uploaded successfully",
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Create product (Service Provider only)
router.post('/', verifyToken, async (req, res) => {
    try {
        const provider = await ensureProviderCanPublish(req, res);
        if (!provider) return;

        const product = new db.Product({
            ...req.body,
            providerId: req.userId,
        });
        await product.save();
        
        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product (Service Provider only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const provider = await ensureProviderCanPublish(req, res);
        if (!provider) return;

        const existing = await db.Product.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (existing.providerId && existing.providerId.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!existing.providerId) {
            existing.providerId = req.userId;
        }

        const payload = { ...req.body, updatedAt: Date.now(), providerId: existing.providerId };
        const product = await db.Product.findByIdAndUpdate(req.params.id, payload, { new: true });
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete product (Service Provider only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const provider = await ensureProviderCanPublish(req, res);
        if (!provider) return;

        const existing = await db.Product.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (existing.providerId && existing.providerId.toString() !== req.userId) {
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
