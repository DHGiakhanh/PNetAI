const mongoose = require("mongoose");
const User = require("./user.model");
const Product = require("./product.model");
const Rating = require("./rating.model");
const Blog = require("./blog.model");
const Cart = require("./cart.model");
const Order = require("./order.model");
const OrderGroup = require("./orderGroup.model");
const Carousel = require("./carousel.model");
const Category = require("./category.model");
const Service = require("./service.model");
const Pet = require("./pet.model");
const Transaction = require("./transaction.model");
const Payout = require("./payout.model");
const Booking = require("./booking.model");
const Notification = require("./notification.model");
const AIHistory = require("./ai_history.model");
const Report = require("./report.model");
const BreedingListing = require("./breedingListing.model");
const BreedingRequest = require("./breedingRequest.model");
const Friendship = require("./friendship.model");
const Conversation = require("./conversation.model");
const Message = require("./message.model");

const db = {}

// Define schema
db.User = User;
db.Product = Product;
db.Rating = Rating;
db.Blog = Blog;
db.Cart = Cart;
db.Order = Order;
db.OrderGroup = OrderGroup;
db.Carousel = Carousel;
db.Category = Category;
db.Service = Service;
db.Pet = Pet;
db.Transaction = Transaction;
db.Payout = Payout;
db.Booking = Booking;
db.Notification = Notification;
db.AIHistory = AIHistory;
db.Report = Report;
db.BreedingListing = BreedingListing;
db.BreedingRequest = BreedingRequest;
db.Friendship = Friendship;
db.Conversation = Conversation;
db.Message = Message;


module.exports = db;
