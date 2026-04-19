const express = require("express");
const authRoutes = require("./auth.route");
const userRoutes = require("./user.route");
const productRoutes = require("./product.route");
const categoryRoutes = require("./category.route");
const serviceRoutes = require("./service.route");
const cartRoutes = require("./cart.route");
const orderRoutes = require("./order.route");
const blogRoutes = require("./blog.route");
const ratingRoutes = require("./rating.route");
const carouselRoutes = require("./carousel.route");
const adminRoutes = require("./admin.route");
const petRoutes = require("./pet.route");
const saleRoutes = require("./sale.route");
const bookingRoutes = require("./booking.route");
const subscriptionRoutes = require("./subscription.route");
const ApiRouter = express.Router();

// Auth routes
ApiRouter.use('/auth', authRoutes);

// User routes
ApiRouter.use('/user', userRoutes);

// Admin routes
ApiRouter.use('/admin', adminRoutes);

// Product routes
ApiRouter.use('/products', productRoutes);

// Category routes
ApiRouter.use('/categories', categoryRoutes);

// Service routes
ApiRouter.use('/services', serviceRoutes);

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

// Pet routes
ApiRouter.use('/pets', petRoutes);

// Sale routes
ApiRouter.use('/sale', saleRoutes);

// Booking routes
ApiRouter.use('/bookings', bookingRoutes);

// Subscription routes
ApiRouter.use('/subscriptions', subscriptionRoutes);

module.exports = ApiRouter;
