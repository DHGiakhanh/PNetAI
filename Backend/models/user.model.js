const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define schema
const userSchema = new Schema({
    email: { type: String, required: [true, "Email is required"], unique: true },
    password: { type: String, required: [true, "Password is required"] },
    name: { type: String, required: [true, "Name is required"] },
    phone: { type: String },
    address: { type: String },
    role: { type: String, enum: ["petowner", "serviceprovider", "admin", "sale"], default: "petowner" },
    // For partner accounts, indicates their business type (vet/spa/shop).
    partnerType: { type: String, enum: ["vet", "spa", "shop"] },
    // Unique customer identifier used by Sales support.
    customerCode: { type: String, unique: true, sparse: true, index: true },
    saleCode: { type: String }, // Code of the sale person who manages this customer
    managedBy: { type: Schema.Types.ObjectId, ref: "User" }, // Reference to sale user
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;