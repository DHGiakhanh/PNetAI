const express = require("express");
const authRoutes = require("./auth.route");
const userRoutes = require("./user.route");
const productRoutes = require("./product.route");
const cartRoutes = require("./cart.route");
const orderRoutes = require("./order.route");
const blogRoutes = require("./blog.route");
const ratingRoutes = require("./rating.route");
const carouselRoutes = require("./carousel.route");
const adminRoutes = require("./admin.route");
const petRoutes = require("./pet.route");
const partnerRoutes = require("./partner.route");
const serviceRoutes = require("./service.route");
const appointmentRoutes = require("./appointment.route");
const feedRoutes = require("./feed.route");
const salesRoutes = require("./sales.route");
const supportRoutes = require("./support.route");
const systemSettingsRoutes = require("./systemSettings.route");
const auditRoutes = require("./audit.route");
const dashboardRoutes = require("./dashboard.route");
const testRoutes = require("./test.route");

const ApiRouter = express.Router();

// Test routes
ApiRouter.use('/test', testRoutes);

// Auth routes
ApiRouter.use('/auth', authRoutes);

// User routes
ApiRouter.use('/user', userRoutes);

// Admin routes
ApiRouter.use('/admin', adminRoutes);

// Product routes
ApiRouter.use('/products', productRoutes);

// Cart routes
ApiRouter.use('/cart', cartRoutes);

// Order routes
ApiRouter.use('/orders', orderRoutes);

// Blog routes
ApiRouter.use('/blogs', blogRoutes);

// Rating routes
ApiRouter.use('/ratings', ratingRoutes);

// Carousel routes
ApiRouter.use('/carousels', carouselRoutes);

// Pet/EHR routes
ApiRouter.use('/pets', petRoutes);

// Partner SaaS routes
ApiRouter.use('/partners', partnerRoutes);
ApiRouter.use('/services', serviceRoutes);
ApiRouter.use('/appointments', appointmentRoutes);

// Social feed routes
ApiRouter.use('/feed', feedRoutes);

// Sales CRM routes
ApiRouter.use('/sales', salesRoutes);

// Support routes (owner/partner create tickets)
ApiRouter.use('/support', supportRoutes);

// System settings routes (admin only)
ApiRouter.use('/system-settings', systemSettingsRoutes);

// Audit & reporting routes (admin only)
ApiRouter.use('/audit', auditRoutes);

// Dashboard routes (role-based)
ApiRouter.use('/dashboard', dashboardRoutes);

module.exports = ApiRouter;
