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

// Get comprehensive dashboard statistics
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query; // Default to last 30 days
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));
        
        // User statistics
        const totalUsers = await db.User.countDocuments({ role: 'user' });
        const newUsers = await db.User.countDocuments({ 
            role: 'user', 
            createdAt: { $gte: daysAgo } 
        });
        const verifiedUsers = await db.User.countDocuments({ 
            role: 'user', 
            isVerified: true 
        });
        
        // Partner statistics
        const totalPartners = await db.User.countDocuments({ role: 'partner' });
        const newPartners = await db.User.countDocuments({ 
            role: 'partner', 
            createdAt: { $gte: daysAgo } 
        });
        
        // Order statistics
        const totalOrders = await db.Order.countDocuments();
        const recentOrders = await db.Order.countDocuments({ 
            createdAt: { $gte: daysAgo } 
        });
        
        const orderStats = await db.Order.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                averageOrderValue: { $avg: "$totalAmount" },
                orderCount: { $sum: 1 }
            }}
        ]);
        
        // Product statistics
        const totalProducts = await db.Product.countDocuments();
        const lowStockProducts = await db.Product.countDocuments({ 
            stock: { $lt: 10 } 
        });
        
        // Support ticket statistics
        const totalTickets = await db.SupportTicket.countDocuments();
        const openTickets = await db.SupportTicket.countDocuments({ 
            status: 'open' 
        });
        const resolvedTickets = await db.SupportTicket.countDocuments({ 
            status: 'resolved',
            updatedAt: { $gte: daysAgo }
        });
        
        // Community statistics
        const totalPosts = await db.Post.countDocuments({ isRemoved: false });
        const recentPosts = await db.Post.countDocuments({ 
            createdAt: { $gte: daysAgo },
            isRemoved: false
        });
        
        // Sales performance
        const totalSales = await db.User.countDocuments({ role: 'sale' });
        const salesWithCustomers = await db.User.countDocuments({ 
            role: 'sale',
            managedBy: { $exists: true, $ne: null }
        });
        
        res.status(200).json({
            period: `${period} days`,
            users: {
                total: totalUsers,
                new: newUsers,
                verified: verifiedUsers,
                verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0
            },
            partners: {
                total: totalPartners,
                new: newPartners
            },
            orders: {
                total: totalOrders,
                recent: recentOrders,
                revenue: orderStats[0]?.totalRevenue || 0,
                averageOrderValue: orderStats[0]?.averageOrderValue || 0
            },
            products: {
                total: totalProducts,
                lowStock: lowStockProducts
            },
            support: {
                total: totalTickets,
                open: openTickets,
                resolved: resolvedTickets
            },
            community: {
                totalPosts: totalPosts,
                recentPosts: recentPosts
            },
            sales: {
                total: totalSales,
                active: salesWithCustomers
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get transaction reports
router.get('/transactions', verifyToken, isAdmin, async (req, res) => {
    try {
        const { period = '30', groupBy = 'day' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));
        
        let groupFormat;
        switch (groupBy) {
            case 'hour':
                groupFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } };
                break;
            case 'week':
                groupFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
                break;
            case 'month':
                groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                break;
            default:
                groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        }
        
        const transactionData = await db.Order.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: {
                _id: groupFormat,
                orderCount: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                averageOrderValue: { $avg: "$totalAmount" }
            }},
            { $sort: { _id: 1 } }
        ]);
        
        // Payment method distribution
        const paymentMethods = await db.Order.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: {
                _id: "$paymentMethod",
                count: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }},
            { $sort: { count: -1 } }
        ]);
        
        // Order status distribution
        const orderStatuses = await db.Order.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: {
                _id: "$status",
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } }
        ]);
        
        res.status(200).json({
            period: `${period} days`,
            groupBy,
            timeline: transactionData,
            paymentMethods,
            orderStatuses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user growth reports
router.get('/user-growth', verifyToken, isAdmin, async (req, res) => {
    try {
        const { period = '30', groupBy = 'day' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));
        
        let groupFormat;
        switch (groupBy) {
            case 'week':
                groupFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
                break;
            case 'month':
                groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                break;
            default:
                groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        }
        
        // User registration by role over time
        const userGrowth = await db.User.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: {
                _id: {
                    date: groupFormat,
                    role: "$role"
                },
                count: { $sum: 1 }
            }},
            { $group: {
                _id: "$_id.date",
                users: { $sum: { $cond: [{ $eq: ["$_id.role", "user"] }, "$count", 0] } },
                partners: { $sum: { $cond: [{ $eq: ["$_id.role", "partner"] }, "$count", 0] } },
                sales: { $sum: { $cond: [{ $eq: ["$_id.role", "sale"] }, "$count", 0] } }
            }},
            { $sort: { _id: 1 } }
        ]);
        
        // Verification rates over time
        const verificationStats = await db.User.aggregate([
            { $match: { createdAt: { $gte: daysAgo } } },
            { $group: {
                _id: groupFormat,
                total: { $sum: 1 },
                verified: { $sum: { $cond: ["$isVerified", 1, 0] } }
            }},
            { $addFields: {
                verificationRate: { $multiply: [{ $divide: ["$verified", "$total"] }, 100] }
            }},
            { $sort: { _id: 1 } }
        ]);
        
        // Partner type distribution
        const partnerTypes = await db.User.aggregate([
            { $match: { role: 'partner' } },
            { $group: {
                _id: "$partnerType",
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } }
        ]);
        
        res.status(200).json({
            period: `${period} days`,
            groupBy,
            userGrowth,
            verificationStats,
            partnerTypes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get system performance metrics
router.get('/performance', verifyToken, isAdmin, async (req, res) => {
    try {
        const { period = '7' } = req.query; // Default to last 7 days for performance
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));
        
        // Database collection sizes
        const collectionStats = {};
        const models = ['User', 'Order', 'Product', 'Post', 'SupportTicket', 'Appointment'];
        
        for (const modelName of models) {
            if (db[modelName]) {
                collectionStats[modelName.toLowerCase()] = await db[modelName].countDocuments();
            }
        }
        
        // Recent activity trends
        const recentActivity = await Promise.all([
            db.User.countDocuments({ createdAt: { $gte: daysAgo } }),
            db.Order.countDocuments({ createdAt: { $gte: daysAgo } }),
            db.Post.countDocuments({ createdAt: { $gte: daysAgo } }),
            db.SupportTicket.countDocuments({ createdAt: { $gte: daysAgo } }),
            db.Appointment.countDocuments({ createdAt: { $gte: daysAgo } })
        ]);
        
        // Error logs (if you implement logging)
        // This would require implementing a logging system
        
        // Storage usage (approximate)
        const storageUsage = {
            users: collectionStats.user * 1000, // Rough estimate
            orders: collectionStats.order * 800,
            products: collectionStats.product * 1200,
            posts: collectionStats.post * 500
        };
        
        res.status(200).json({
            period: `${period} days`,
            collectionStats,
            recentActivity: {
                newUsers: recentActivity[0],
                newOrders: recentActivity[1],
                newPosts: recentActivity[2],
                newTickets: recentActivity[3],
                newAppointments: recentActivity[4]
            },
            storageUsage,
            totalEstimatedStorage: Object.values(storageUsage).reduce((a, b) => a + b, 0)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Export reports (CSV format)
router.get('/export/:type', verifyToken, isAdmin, async (req, res) => {
    try {
        const { type } = req.params;
        const { period = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));
        
        let data, filename;
        
        switch (type) {
            case 'users':
                data = await db.User.find({ createdAt: { $gte: daysAgo } })
                    .select('name email role isVerified createdAt')
                    .lean();
                filename = `users_${period}days.csv`;
                break;
            case 'orders':
                data = await db.Order.find({ createdAt: { $gte: daysAgo } })
                    .populate('user', 'name email')
                    .select('user totalAmount status paymentMethod createdAt')
                    .lean();
                filename = `orders_${period}days.csv`;
                break;
            case 'tickets':
                data = await db.SupportTicket.find({ createdAt: { $gte: daysAgo } })
                    .populate('createdBy', 'name email')
                    .populate('assignedTo', 'name email')
                    .select('createdBy assignedTo subject status createdAt')
                    .lean();
                filename = `tickets_${period}days.csv`;
                break;
            default:
                return res.status(400).json({ message: "Invalid export type" });
        }
        
        // Convert to CSV (simplified)
        const csv = convertToCSV(data);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to convert array of objects to CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Handle nested objects and arrays
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value).replace(/"/g, '""');
            }
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

module.exports = router;
