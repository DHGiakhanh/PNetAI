const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
        type: String, 
        enum: ["service_booking", "product_order", "membership_fee", "blog_fee"], 
        required: true 
    },
    provider: { type: Schema.Types.ObjectId, ref: "User" }, // Target clinic or shop
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ["pending", "success", "failed", "cancelled"], 
        default: "pending" 
    },
    paymentMethod: { type: String, default: "PayOS" },
    payosOrderCode: { type: String }, // Code from PayOS
    referenceId: { type: Schema.Types.ObjectId }, // ID of the Order or ServiceBooking
    evidenceUrl: { type: String }, // For manual confirmation
    note: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
