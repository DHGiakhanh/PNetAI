const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
});

const orderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: Schema.Types.ObjectId, ref: "User", index: true },
    group: { type: Schema.Types.ObjectId, ref: "OrderGroup", index: true },
    items: [orderItemSchema],
    subtotalAmount: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    shippingMethod: {
        type: String,
        enum: ["standard", "express"],
        default: "standard"
    },
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled", "return_requested"],
        default: "pending"
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "PAYOS"],
        default: "COD"
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "pending", "paid", "failed", "cancelled", "refund_pending", "refunded"],
        default: "unpaid"
    },
    paidAt: { type: Date },
    inventoryReserved: { type: Boolean, default: false },
    payos: {
        orderCode: { type: Number, index: true, unique: true, sparse: true },
        paymentLinkId: { type: String },
        checkoutUrl: { type: String },
        qrCode: { type: String },
        status: { type: String },
        lastWebhookData: { type: Schema.Types.Mixed }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
