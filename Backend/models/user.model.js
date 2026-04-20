const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define schema
const userSchema = new Schema({
    email: { type: String, required: [true, "Email is required"], unique: true },
    password: { type: String, required: [true, "Password is required"] },
    name: { type: String, required: [true, "Name is required"] },
    phone: { type: String },
    address: { type: String },
    avatarUrl: { type: String },
    description: { type: String },
    googleId: { type: String },
    role: {
        type: String,
        enum: ["user", "admin", "sale", "service_provider", "shop"],
        default: "user",
    },
    saleCode: { type: String }, // Code of the sale person who manages this customer
    managedBy: { type: Schema.Types.ObjectId, ref: "User" }, // Reference to sale user
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    providerOnboardingStatus: {
        type: String,
        enum: [
            "pending_sale_approval",
            "pending_legal_submission",
            "pending_legal_approval",
            "approved",
        ],
    },
    legalDocuments: {
        clinicName: { type: String },
        clinicLicenseNumber: { type: String },
        clinicLicenseUrl: { type: String },
        businessLicenseUrl: { type: String },
        doctorLicenseUrl: { type: String },
        submissionNote: { type: String },
        submittedAt: { type: Date },
        reviewedAt: { type: Date },
        reviewNote: { type: String },
    },
    clinicImages: [{ type: String }],
    doctors: [{ type: String }],
    subscriptionPlan: {
        type: String,
        enum: ["free", "silver", "gold"],
        default: "free"
    },
    subscriptionExpiresAt: { type: Date },
    articleCredits: { type: Number, default: 5 },
    operatingHours: {
        start: { type: String, default: "08:00" },
        end: { type: String, default: "18:00" },
    },
    bookingCapacity: { type: Number, default: 4 },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
