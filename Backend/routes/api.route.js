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

const ApiRouter = express.Router();

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

module.exports = ApiRouter;
