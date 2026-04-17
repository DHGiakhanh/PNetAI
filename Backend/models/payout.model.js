const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const payoutSchema = new Schema({
    provider: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 }, // Platform fee
    netAmount: { type: Number, required: true }, // amount - fee
    status: { 
        type: String, 
        enum: ["pending", "completed", "rejected"], 
        default: "pending" 
    },
    paymentEvidenceUrl: { type: String }, // Screenshot of bank transfer
    adminNote: { type: String },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Payout = mongoose.model("Payout", payoutSchema);

module.exports = Payout;
