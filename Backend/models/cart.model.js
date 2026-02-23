const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
});

const cartSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
