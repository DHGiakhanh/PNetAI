const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderGroupSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    subtotalAmount: { type: Number, required: true, default: 0 },
    shippingAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    shippingMethod: {
        type: String,
        enum: ["standard", "express"],
        default: "standard",
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "PAYOS"],
        default: "COD",
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "pending", "paid", "failed", "cancelled", "refund_pending", "refunded"],
        default: "unpaid",
    },
    paidAt: { type: Date },
    shippingAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
    },
    payos: {
        orderCode: { type: Number, index: true, unique: true, sparse: true },
        paymentLinkId: { type: String },
        checkoutUrl: { type: String },
        qrCode: { type: String },
        status: { type: String },
        lastWebhookData: { type: Schema.Types.Mixed },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const OrderGroup = mongoose.model("OrderGroup", orderGroupSchema);

module.exports = OrderGroup;
