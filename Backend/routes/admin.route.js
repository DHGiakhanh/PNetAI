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

// Register/Create new user (Manage by Admin)
router.post('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, email, password, role, saleCode } = req.body;
        
        // Basic validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await db.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        
        const newUser = new db.User({
            name,
            email,
            password: hashedPassword,
            role,
            saleCode,
            isVerified: true // Admin created accounts are verified by default
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users with filters
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20, providerOnboardingStatus, isVerified } = req.query;
        
        let query = {};
        
        if (role) {
            query.role = role;
        }

        if (providerOnboardingStatus) {
            query.providerOnboardingStatus = providerOnboardingStatus;
        }

        if (isVerified !== undefined && isVerified !== '') {
            query.isVerified = isVerified === 'true';
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { saleCode: { $regex: search, $options: 'i' } }
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

        // Calculate real metrics if listing sales, providers, or users
        let usersWithMetrics = users;
        const isSaleRequest = role === 'sale';
        const isProviderRequest = role === 'service_provider' || role === 'shop';
        const isUserRequest = role === 'user';

        if (isSaleRequest || isProviderRequest || isUserRequest) {
            usersWithMetrics = await Promise.all(users.map(async (user) => {
                const userObj = user.toObject();
                
                if (isSaleRequest) {
                    // Count managed partners
                    const partnersCount = await db.User.countDocuments({
                        role: { $in: ["service_provider", "shop"] },
                        managedBy: user._id
                    });
                    
                    // Calculate revenue from managed partners
                    const managedProviders = await db.User.find({ managedBy: user._id }, '_id');
                    const providerIds = managedProviders.map(p => p._id);
                    
                    const revenueResult = await db.Transaction.aggregate([
                        { $match: { provider: { $in: providerIds }, status: "success" } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]);
                    
                    userObj.partnersCount = partnersCount;
                    userObj.totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
                } else if (isProviderRequest) {
                    // Metrics for clinic/shop
                    const revenueResult = await db.Transaction.aggregate([
                        { $match: { provider: user._id, status: "success" } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]);
                    
                    const bookingsCount = await db.Transaction.countDocuments({ 
                        provider: user._id, 
                        status: "success",
                        type: { $in: ["service_booking", "product_order"] }
                    });
                    
                    userObj.totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
                    userObj.bookingsCount = bookingsCount;
                } else if (isUserRequest) {
                    // Metrics for Pet Owner
                    const spendingResult = await db.Transaction.aggregate([
                        { $match: { user: user._id, status: "success" } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]);
                    
                    const petCount = await db.Pet.countDocuments({ owner: user._id });
                    
                    userObj.totalSpent = spendingResult.length > 0 ? spendingResult[0].total : 0;
                    userObj.petCount = petCount;
                }
                
                return userObj;
            }));
        }
        
        res.status(200).json({
            users: usersWithMetrics,
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

// Update User
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, email, role, saleCode, isVerified, password } = req.body;
        const user = await db.User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (saleCode !== undefined) user.saleCode = saleCode;
        if (isVerified !== undefined) user.isVerified = isVerified;
        
        if (password) {
            user.password = await bcryptjs.hash(password, 10);
        }

        await user.save();
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete User
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await db.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await db.User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
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

// --- Blog Management (Admin) ---

// List all pending blog posts for admin review
router.get("/blogs/pending", verifyToken, isAdmin, async (req, res) => {
    try {
        const pendingBlogs = await db.Blog.find({
            status: "pending"
        })
        .populate("author", "name email avatarUrl")
        .sort({ createdAt: -1 });

        res.status(200).json({ pendingBlogs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Review (Approve/Reject) any blog post
router.put("/blogs/:id/review", verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, reviewNote } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Use 'approved' or 'rejected'." });
        }

        const blog = await db.Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog post not found" });
        }

        blog.status = status;
        blog.reviewNote = reviewNote || "";
        blog.reviewedBy = req.userId;
        blog.reviewedAt = new Date();
        await blog.save();

        res.status(200).json({
            message: `Blog post ${status} successfully.`,
            blog
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Finance Management ---

// List all transactions (Incoming)
router.get("/finance/transactions", verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, type, search, page = 1, limit = 20 } = req.query;
        let query = {};

        if (status) query.status = status;
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { payosOrderCode: { $regex: search, $options: 'i' } },
                { note: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const transactions = await db.Transaction.find(query)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await db.Transaction.countDocuments(query);
        res.status(200).json({ 
            transactions,
            pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Manual Confirm Transaction
router.put("/finance/transactions/:id/confirm", verifyToken, isAdmin, async (req, res) => {
    try {
        const { evidenceUrl, note } = req.body;
        const transaction = await db.Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });

        transaction.status = "success";
        if (evidenceUrl) transaction.evidenceUrl = evidenceUrl;
        if (note) transaction.note = (transaction.note ? transaction.note + "\n" : "") + "Manual Confirm: " + note;
        transaction.updatedAt = new Date();
        await transaction.save();

        res.status(200).json({ message: "Transaction confirmed manually", transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Payout Management ---

// List all payouts (Outgoing)
router.get("/finance/payouts", verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let query = {};
        if (status) query.status = status;

        const skip = (page - 1) * limit;
        const payouts = await db.Payout.find(query)
            .populate("provider", "name email legalDocuments")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await db.Payout.countDocuments(query);
        res.status(200).json({ 
            payouts,
            pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update payout status (Confirm with evidence)
router.put("/finance/payouts/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, paymentEvidenceUrl, adminNote } = req.body;
        const payout = await db.Payout.findById(req.params.id);
        if (!payout) return res.status(404).json({ message: "Payout record not found" });

        if (status) payout.status = status;
        if (paymentEvidenceUrl) payout.paymentEvidenceUrl = paymentEvidenceUrl;
        if (adminNote) payout.adminNote = adminNote;
        payout.updatedAt = new Date();
        
        await payout.save();
        res.status(200).json({ message: "Payout updated", payout });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Calculate statistics for Overview Dashboard
router.get('/statistics/dashboard', verifyToken, isAdmin, async (req, res) => {
    try {
        // Real-time metrics
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const ordersToday = await db.Transaction.countDocuments({ 
            createdAt: { $gte: todayStart },
            status: "success"
        });

        const gmvResult = await db.Transaction.aggregate([
            { $match: { status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const gmv = gmvResult.length > 0 ? gmvResult[0].total : 0;

        const pendingPosts = await db.Blog.countDocuments({ status: "pending" });
        const pendingLegal = await db.User.countDocuments({ 
            role: { $in: ["service_provider", "shop"] },
            providerOnboardingStatus: "pending_legal_approval"
        });

        // Growth Charts (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const userGrowth = await db.User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, role: "user" } },
            { $group: { 
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                count: { $sum: 1 } 
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const revenueTrend = await db.Transaction.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, status: "success" } },
            { $group: { 
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                revenue: { $sum: "$amount" } 
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Mock Activity Logs (replace with real logs if you have an Activity model)
        const recentLogs = [
            { id: 1, user: "Admin", action: "Approved blog 'Modern Pet Care'", time: "2 hours ago" },
            { id: 2, user: "Sale Agent", action: "Verified Clinic 'Paw Spa'", time: "4 hours ago" },
            { id: 3, user: "System", action: "Keyword 'Scam' added to blacklist", time: "1 day ago" }
        ];

        res.status(200).json({
            kpis: { ordersToday, gmv, pendingPosts, pendingLegal },
            charts: { userGrowth, revenueTrend },
            recentLogs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
