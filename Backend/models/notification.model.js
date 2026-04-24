const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" }, // Recipient (null if for all admins)
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: ["info", "success", "warning", "error", "refund_request"], 
        default: "info" 
    },
    relatedId: { type: Schema.Types.ObjectId }, // Reference to Booking or Order
    isRead: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false }, // If true, visible to admin dashboard
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
