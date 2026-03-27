const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String }, // Icon name or URL
    color: { type: String, default: "#6B7280" }, // Hex color code
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;