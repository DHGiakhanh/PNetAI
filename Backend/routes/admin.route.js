const express = require("express");
const bcryptjs = require("bcryptjs");
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

const isServiceProvider = (req, res, next) => {
    if (req.role !== 'service_provider' && req.role !== 'shop') {
        return res.status(403).json({ message: "Access denied. Service Provider only." });
    }
    next();
};

const getProviderOnboardingStatus = (user) => {
    if (user?.role !== "service_provider" && user?.role !== "shop") return undefined;
    if (user.providerOnboardingStatus) return user.providerOnboardingStatus;
    return user.isVerified ? "pending_legal_submission" : "pending_sale_approval";
};

const canProviderOperate = (user) =>
    (user?.role === "service_provider" || user?.role === "shop") &&
    user.isVerified &&
    getProviderOnboardingStatus(user) === "approved";

const ensureProviderFullyApproved = async (req, res, next) => {
    try {
        const provider = await db.User.findById(req.userId).select("role isVerified providerOnboardingStatus");
        if (!provider || (provider.role !== "service_provider" && provider.role !== "shop")) {
            return res.status(403).json({ message: "Access denied. Service Provider only." });
        }

        if (!canProviderOperate(provider)) {
            return res.status(403).json({
                message: "Upload legal documents and wait for sale approval before accessing provider workspace.",
                code: "PROVIDER_NOT_READY",
                providerOnboardingStatus: getProviderOnboardingStatus(provider),
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Get all users with filters
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        
        let query = {};
        
        if (role) {
            query.role = role;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (page - 1) * limit;
        
        const users = await db.User.find(query)
            .select('-password -verificationToken -resetPasswordToken')
            .populate('managedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
            
        const total = await db.User.countDocuments(query);
        
        res.status(200).json({
            users,
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

// Get user by ID
router.get('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await db.User.findById(req.params.id)
            .select('-password -verificationToken -resetPasswordToken')
            .populate('managedBy', 'name email');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // If user is a sale, get their managed customers
        let managedCustomers = [];
        if (user.role === 'sale') {
            managedCustomers = await db.User.find({ managedBy: user._id })
                .select('name email createdAt')
                .sort({ createdAt: -1 });
        }
        
        res.status(200).json({ 
            user,
            managedCustomers: user.role === 'sale' ? managedCustomers : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create sale account
router.post('/users/sale', verifyToken, isAdmin, async (req, res) => {
    try {
        const { email, password, name, phone, address, saleCode } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ message: "Email, password, and name are required" });
        }
        
        if (!saleCode) {
            return res.status(400).json({ message: "Sale code is required" });
        }
        
        const existingUser = await db.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        
        // Check if sale code already exists
        const existingSaleCode = await db.User.findOne({ saleCode, role: 'sale' });
        if (existingSaleCode) {
            return res.status(400).json({ message: "Sale code already exists" });
        }
        
        const hashedPassword = await bcryptjs.hash(password, 10);
        
        const newSale = new db.User({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            role: 'sale',
            saleCode: saleCode, // Store the unique sale code
            isVerified: true // Auto verify for admin-created accounts
        });
        
        await newSale.save();
        
        res.status(201).json({
            message: "Sale account created successfully",
            user: {
                id: newSale._id,
                email: newSale.email,
                name: newSale.name,
                role: newSale.role,
                saleCode: newSale.saleCode
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, phone, address, role, isVerified } = req.body;
        
        const user = await db.User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (role) user.role = role;
        if (isVerified !== undefined) user.isVerified = isVerified;
        
        await user.save();
        
        res.status(200).json({
            message: "User updated successfully",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await db.User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Prevent deleting yourself
        if (user._id.toString() === req.userId) {
            return res.status(400).json({ message: "Cannot delete your own account" });
        }
        
        // If deleting a sale, unlink their customers
        if (user.role === 'sale') {
            await db.User.updateMany(
                { managedBy: user._id },
                { $unset: { managedBy: "", saleCode: "" } }
            );
        }
        
        await db.User.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reset user password
router.post('/users/:id/reset-password', verifyToken, isAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        
        const user = await db.User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        
        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get statistics
router.get('/statistics', verifyToken, isAdmin, async (req, res) => {
    try {
        const totalUsers = await db.User.countDocuments({ role: 'user' });
        const totalSales = await db.User.countDocuments({ role: 'sale' });
        const totalAdmins = await db.User.countDocuments({ role: 'admin' });
        const verifiedUsers = await db.User.countDocuments({ isVerified: true });
        const unverifiedUsers = await db.User.countDocuments({ isVerified: false });
        
        const totalOrders = await db.Order.countDocuments();
        const totalProducts = await db.Product.countDocuments();
        const totalBlogs = await db.Blog.countDocuments();
        
        // Recent users
        const recentUsers = await db.User.find()
            .select('name email role createdAt')
            .sort({ createdAt: -1 })
            .limit(5);
        
        res.status(200).json({
            users: {
                total: totalUsers,
                verified: verifiedUsers,
                unverified: unverifiedUsers
            },
            sales: totalSales,
            admins: totalAdmins,
            orders: totalOrders,
            products: totalProducts,
            blogs: totalBlogs,
            recentUsers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all products (Service Provider)
router.get('/products', verifyToken, isServiceProvider, ensureProviderFullyApproved, async (req, res) => {
    try {
        const { search } = req.query;
        let query = { providerId: req.userId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }

        const products = await db.Product.find(query)
            .populate('providerId', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all categories (Service Provider, includes inactive)
router.get('/categories', verifyToken, isServiceProvider, ensureProviderFullyApproved, async (req, res) => {
    try {
        const categories = await db.Category.find().sort({ sortOrder: 1, name: 1 });
        res.status(200).json({ categories });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get service provider services (owned by current user)
router.get('/services', verifyToken, isServiceProvider, ensureProviderFullyApproved, async (req, res) => {
    try {
        const { search } = req.query;
        let query = { providerId: req.userId };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }

        const services = await db.Service.find(query).sort({ createdAt: -1 });
        res.status(200).json({ services });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get customers bookings for service provider dashboard
router.get('/customers-bookings', verifyToken, isServiceProvider, ensureProviderFullyApproved, async (req, res) => {
    try {
        const orders = await db.Order.find()
            .populate('user', 'name email phone')
            .populate('items.product', 'providerId')
            .sort({ createdAt: -1 })
            .limit(300);

        const bookingMap = new Map();

        for (const order of orders) {
            const user = order.user;
            if (!user) continue;

            const providerItems = (order.items || []).filter((item) => {
                const product = item.product;
                return product?.providerId && product.providerId.toString() === req.userId;
            });

            if (providerItems.length === 0) {
                continue;
            }

            const providerTotal = providerItems.reduce(
                (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
                0
            );

            const key = user._id.toString();
            const existing = bookingMap.get(key) || {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || "",
                },
                totalOrders: 0,
                totalSpent: 0,
                lastBookedAt: order.createdAt,
            };

            existing.totalOrders += 1;
            existing.totalSpent += providerTotal;
            if (!existing.lastBookedAt || new Date(order.createdAt) > new Date(existing.lastBookedAt)) {
                existing.lastBookedAt = order.createdAt;
            }
            bookingMap.set(key, existing);
        }

        const customers = Array.from(bookingMap.values()).sort(
            (a, b) => new Date(b.lastBookedAt) - new Date(a.lastBookedAt)
        );

        res.status(200).json({ customers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Assign customer to sale
router.post('/users/:userId/assign-sale', verifyToken, isAdmin, async (req, res) => {
    try {
        const { saleId } = req.body;
        
        const user = await db.User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (user.role !== 'user') {
            return res.status(400).json({ message: "Can only assign sales to regular users" });
        }
        
        const sale = await db.User.findById(saleId);
        if (!sale || sale.role !== 'sale') {
            return res.status(404).json({ message: "Sale user not found" });
        }
        
        user.managedBy = saleId;
        user.saleCode = sale.email;
        await user.save();
        
        res.status(200).json({ 
            message: "Sale assigned successfully",
            user: {
                id: user._id,
                name: user.name,
                managedBy: sale.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
