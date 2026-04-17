const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serviceBookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    pet: { type: Schema.Types.ObjectId, ref: "Pet", required: true },
    bookingDate: { type: Date, required: true },
    bookingTime: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ["pending", "confirmed", "completed", "cancelled"], 
        default: "pending" 
    },
    paymentMethod: { type: String, default: "PayOS" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ServiceBooking = mongoose.model("ServiceBooking", serviceBookingSchema);

module.exports = ServiceBooking;
