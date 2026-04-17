const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    image: { type: String },
    isHot: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
    reviewNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        image: { type: String },
        likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        replies: [{
            user: { type: Schema.Types.ObjectId, ref: "User", required: true },
            text: { type: String, required: true },
            image: { type: String },
            createdAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
