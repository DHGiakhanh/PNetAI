const mongoose = require("mongoose");
const User = require("./user.model");
const Product = require("./product.model");
const Rating = require("./rating.model");
const Blog = require("./blog.model");
const Cart = require("./cart.model");
const Order = require("./order.model");
const Carousel = require("./carousel.model");
const Category = require("./category.model");
const Service = require("./service.model");
const Pet = require("./pet.model");

const db = {}

// Define schema
db.User = User;
db.Product = Product;
db.Rating = Rating;
db.Blog = Blog;
db.Cart = Cart;
db.Order = Order;
db.Carousel = Carousel;
db.Category = Category;
db.Service = Service;
db.Pet = Pet;


module.exports = db;
