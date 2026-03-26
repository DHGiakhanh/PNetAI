const mongoose = require("mongoose");
const User = require("./user.model");
const Product = require("./product.model");
const Rating = require("./rating.model");
const Blog = require("./blog.model");
const Cart = require("./cart.model");
const Order = require("./order.model");
const Carousel = require("./carousel.model");
const Pet = require("./pet.model");
const PartnerApplication = require("./partnerApplication.model");
const Service = require("./service.model");
const Appointment = require("./appointment.model");
const Post = require("./post.model");
const Comment = require("./comment.model");
const Like = require("./like.model");
const Follow = require("./follow.model");
const Lead = require("./lead.model");
const SupportTicket = require("./supportTicket.model");
const SystemSetting = require("./systemSetting.model");

const db = {}

// Define schema
db.User = User;
db.Product = Product;
db.Rating = Rating;
db.Blog = Blog;
db.Cart = Cart;
db.Order = Order;
db.Carousel = Carousel;
db.Pet = Pet;
db.PartnerApplication = PartnerApplication;
db.Service = Service;
db.Appointment = Appointment;
db.Post = Post;
db.Comment = Comment;
db.Like = Like;
db.Follow = Follow;
db.Lead = Lead;
db.SupportTicket = SupportTicket;
db.SystemSetting = SystemSetting;

module.exports = db;