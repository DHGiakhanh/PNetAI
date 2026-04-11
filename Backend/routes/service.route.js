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
    return user.isVerified ? "approved" : "pending_sale_approval";
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

const toServiceResponse = (serviceDoc) => {
    const service = serviceDoc?.toObject ? serviceDoc.toObject() : serviceDoc;
    const provider = service?.providerId && typeof service.providerId === "object" ? service.providerId : null;
    return {
        ...service,
        providerName: provider?.name || "",
    };
};

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
            services: services.map(toServiceResponse),
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
        res.status(200).json({ services: services.map(toServiceResponse) });
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
        res.status(200).json({ services: services.map(toServiceResponse) });
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
        res.status(200).json({ services: services.map(toServiceResponse) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload service image (Service Provider only)
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
                    folder: "pnetai/services",
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
            message: "Service image uploaded successfully",
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
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
        
        res.status(200).json({ service: toServiceResponse(service) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create service (Service Provider only)
router.post('/', verifyToken, async (req, res) => {
    try {
        const provider = await ensureProviderCanPublish(req, res);
        if (!provider) return;
        
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
        const provider = await ensureProviderCanPublish(req, res);
        if (!provider) return;

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
        const provider = await ensureProviderCanPublish(req, res);
        if (!provider) return;

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
