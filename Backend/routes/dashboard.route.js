const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { requireAnyRole } = require("../middlewares/rbac");

const router = express.Router();

// Pet Owner Dashboard
router.get('/petowner', verifyToken, requireAnyRole(['petowner']), async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get user's pets
        const pets = await db.Pet.find({ owner: userId })
            .select('name species breed age photo createdAt')
            .sort({ createdAt: -1 });
        
        // Get upcoming appointments
        const upcomingAppointments = await db.Appointment.find({
            user: userId,
            status: { $in: ['pending', 'confirmed'] },
            dateTime: { $gte: new Date() }
        })
        .populate('service', 'name price')
        .populate('partner', 'name partnerType address')
        .sort({ dateTime: 1 })
        .limit(5);
        
        // Get recent orders
        const recentOrders = await db.Order.find({ user: userId })
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 })
            .limit(5);
        
        // Get AI consultations (from feed posts with AI tags or separate consultation model)
        const aiConsultations = await db.Post.find({
            author: userId,
            content: { $regex: /ai|consultation|symptom/i }
        })
        .sort({ createdAt: -1 })
        .limit(3);
        
        // Get notifications (unread)
        const notifications = await db.Comment.find({
            post: { $in: aiConsultations.map(c => c._id) },
            user: { $ne: userId },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(10);
        
        // Get unread notifications count
        const unreadCount = notifications.length;
        
        res.status(200).json({
            overview: {
                totalPets: pets.length,
                upcomingAppointments: upcomingAppointments.length,
                recentOrders: recentOrders.length,
                unreadNotifications: unreadCount
            },
            pets,
            upcomingAppointments,
            recentOrders,
            aiConsultations,
            notifications
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Service Provider Dashboard
router.get('/serviceprovider', verifyToken, requireAnyRole(['serviceprovider']), async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get partner profile
        const partner = await db.User.findById(userId)
            .select('name email partnerType isVerified');
        
        // Get today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayAppointments = await db.Appointment.find({
            partner: userId,
            dateTime: { $gte: today, $lt: tomorrow }
        })
        .populate('user', 'name email')
        .populate('service', 'name price')
        .sort({ dateTime: 1 });
        
        // Get pending appointments
        const pendingAppointments = await db.Appointment.find({
            partner: userId,
            status: 'pending'
        })
        .populate('user', 'name email')
        .populate('service', 'name price')
        .sort({ createdAt: -1 });
        
        // Get recent orders for shop partners
        const recentOrders = await db.Order.find({
            'items.product': { $exists: true }
        })
        .populate('user', 'name email')
        .populate('items.product')
        .sort({ createdAt: -1 })
        .limit(10);
        
        // Get services offered
        const services = await db.Service.find({ partner: userId })
            .sort({ name: 1 });
        
        // Get business statistics
        const stats = {
            totalAppointments: await db.Appointment.countDocuments({ partner: userId }),
            completedAppointments: await db.Appointment.countDocuments({ 
                partner: userId, 
                status: 'completed' 
            }),
            totalServices: services.length,
            totalOrders: recentOrders.length
        };
        
        res.status(200).json({
            partner,
            todayAppointments,
            pendingAppointments,
            recentOrders,
            services,
            stats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Sales Dashboard
router.get('/sales', verifyToken, requireAnyRole(['sale']), async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get sales profile
        const salesProfile = await db.User.findById(userId)
            .select('name email saleCode');
        
        // Get managed customers
        const customers = await db.User.find({ managedBy: userId })
            .select('name email customerCode createdAt')
            .sort({ createdAt: -1 });
        
        // Get leads
        const leads = await db.Lead.find({ createdBy: userId })
            .sort({ createdAt: -1 });
        
        // Get support tickets
        const tickets = await db.SupportTicket.find({
            assignedTo: userId
        })
        .populate('createdBy', 'name email customerCode')
        .sort({ updatedAt: -1 });
        
        // Get statistics
        const stats = {
            totalCustomers: customers.length,
            totalLeads: leads.length,
            openTickets: await db.SupportTicket.countDocuments({ 
                assignedTo: userId, 
                status: { $in: ['open', 'in_progress'] }
            }),
            newCustomersThisMonth: await db.User.countDocuments({
                managedBy: userId,
                createdAt: { $gte: new Date(new Date().setDate(1)) }
            })
        };
        
        res.status(200).json({
            salesProfile,
            customers,
            leads,
            tickets,
            stats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Dashboard
router.get('/admin', verifyToken, requireAnyRole(['admin']), async (req, res) => {
    try {
        // Get system overview statistics
        const stats = {
            users: {
                total: await db.User.countDocuments({ role: 'petowner' }),
                newThisMonth: await db.User.countDocuments({
                    role: 'petowner',
                    createdAt: { $gte: new Date(new Date().setDate(1)) }
                }),
                verified: await db.User.countDocuments({ 
                    role: 'petowner', 
                    isVerified: true 
                })
            },
            partners: {
                total: await db.User.countDocuments({ role: 'serviceprovider' }),
                pending: await db.PartnerApplication.countDocuments({ 
                    status: 'pending' 
                }),
                verified: await db.User.countDocuments({ 
                    role: 'serviceprovider', 
                    isVerified: true 
                })
            },
            sales: {
                total: await db.User.countDocuments({ role: 'sale' }),
                active: await db.User.countDocuments({ 
                    role: 'sale',
                    managedBy: { $exists: true }
                })
            },
            orders: {
                total: await db.Order.countDocuments(),
                thisMonth: await db.Order.countDocuments({
                    createdAt: { $gte: new Date(new Date().setDate(1)) }
                }),
                totalRevenue: await db.Order.aggregate([
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]).then(result => result[0]?.total || 0)
            },
            appointments: {
                total: await db.Appointment.countDocuments(),
                today: await db.Appointment.countDocuments({
                    dateTime: { 
                        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        $lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                })
            },
            support: {
                openTickets: await db.SupportTicket.countDocuments({ 
                    status: { $in: ['open', 'in_progress'] }
                }),
                resolvedToday: await db.SupportTicket.countDocuments({
                    status: 'resolved',
                    updatedAt: { 
                        $gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                })
            }
        };
        
        // Get recent activities
        const recentActivities = {
            newUsers: await db.User.find({ role: 'petowner' })
                .select('name email createdAt')
                .sort({ createdAt: -1 })
                .limit(5),
            newPartners: await db.PartnerApplication.find()
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(5),
            recentOrders: await db.Order.find()
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
        };
        
        // Get system alerts
        const alerts = {
            lowStockProducts: await db.Product.countDocuments({ 
                stock: { $lt: 10 } 
            }),
            unverifiedPartners: await db.PartnerApplication.countDocuments({ 
                status: 'pending' 
            }),
            overdueTickets: await db.SupportTicket.countDocuments({
                status: { $in: ['open', 'in_progress'] },
                createdAt: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // 3 days old
            })
        };
        
        res.status(200).json({
            stats,
            recentActivities,
            alerts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
