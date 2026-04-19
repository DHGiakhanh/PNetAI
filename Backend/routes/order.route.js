const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const {
    createPaymentLink,
    getPaymentLinkInfo,
    cancelPaymentLink,
    verifyWebhookSignature,
} = require("../utils/payos");

const router = express.Router();

const toUpperText = (value) => (typeof value === "string" ? value.trim().toUpperCase() : "");

const generateOrderCode = () => {
    const random = Math.floor(Math.random() * 900) + 100;
    return Number(`${Date.now()}${random}`);
};

const generateUniqueOrderCode = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const orderCode = generateOrderCode();
        const existingOrder = await db.Order.exists({ "payos.orderCode": orderCode });
        if (!existingOrder) {
            return orderCode;
        }
    }

    throw new Error("Cannot generate unique PayOS orderCode");
};

const ensureValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

const sanitizeDescription = (description, orderCode) => {
    const fallback = `DH${orderCode}`;
    if (!description || typeof description !== "string") {
        return fallback;
    }

    const cleaned = description.replace(/\s+/g, " ").trim();
    return cleaned ? cleaned.slice(0, 25) : fallback;
};

const normalizeShippingAddress = (shippingAddress = {}) => {
    return {
        name: shippingAddress.name?.toString().trim(),
        phone: shippingAddress.phone?.toString().trim(),
        address: shippingAddress.address?.toString().trim(),
    };
};

const isShippingAddressValid = (shippingAddress) => {
    return Boolean(shippingAddress?.name && shippingAddress?.phone && shippingAddress?.address);
};

const toOrderItemsFromCart = (cart) => {
    return cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
    }));
};

const toPayOSItemsFromCart = (cart) => {
    return cart.items.map((item) => ({
        name: item.product.name.slice(0, 100),
        quantity: item.quantity,
        price: Math.round(item.price),
    }));
};

const toPlainObject = (value) => {
    if (!value) {
        return {};
    }
    return typeof value.toObject === "function" ? value.toObject() : value;
};

const isInventoryReserved = (order) => order.inventoryReserved !== false;

const reserveInventory = async (items) => {
    for (const item of items) {
        await db.Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
        });
    }
};

const restoreInventory = async (order) => {
    if (!isInventoryReserved(order)) {
        return;
    }

    for (const item of order.items) {
        await db.Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
        });
    }

    order.inventoryReserved = false;
};

const clearCart = async (cart) => {
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
};

const ensureCartAndStock = async (userId) => {
    const cart = await db.Cart.findOne({ user: userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
        return { error: "Cart is empty" };
    }

    for (const item of cart.items) {
        if (!item.product) {
            return { error: "Product in cart not found" };
        }

        if (item.product.stock < item.quantity) {
            return { error: `Insufficient stock for ${item.product.name}` };
        }
    }

    return { cart };
};

const syncOrderStatusWithPayOS = async (order, payOSStatus) => {
    const normalizedStatus = toUpperText(payOSStatus);

    if (!normalizedStatus) {
        return;
    }

    if (normalizedStatus === "PAID") {
        order.paymentStatus = "paid";
        order.paidAt = order.paidAt || Date.now();
        if (order.status === "pending") {
            order.status = "processing";
        }
        return;
    }

    if (["CANCELLED", "EXPIRED"].includes(normalizedStatus)) {
        if (order.paymentStatus !== "paid") {
            order.paymentStatus = "cancelled";
        }
        if (order.status !== "delivered") {
            order.status = "cancelled";
        }
        await restoreInventory(order);
        return;
    }

    if (normalizedStatus === "PENDING") {
        if (order.paymentStatus !== "paid") {
            order.paymentStatus = "pending";
        }
        return;
    }

    if (order.paymentStatus !== "paid") {
        order.paymentStatus = "failed";
    }
};

// Create order (Checkout COD)
router.post("/checkout", verifyToken, async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;
        const normalizedPaymentMethod = toUpperText(paymentMethod || "COD");

        if (normalizedPaymentMethod === "PAYOS") {
            return res.status(400).json({
                message: "Use /orders/checkout/payos for PayOS payment method",
            });
        }

        const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);
        if (!isShippingAddressValid(normalizedShippingAddress)) {
            return res.status(400).json({ message: "Invalid shipping address" });
        }

        const { cart, error } = await ensureCartAndStock(req.userId);
        if (error) {
            return res.status(400).json({ message: error });
        }

        const order = new db.Order({
            user: req.userId,
            items: toOrderItemsFromCart(cart),
            totalAmount: cart.totalAmount,
            shippingAddress: normalizedShippingAddress,
            paymentMethod: "COD",
            paymentStatus: "unpaid",
        });

        await order.save();

        await reserveInventory(order.items);
        order.inventoryReserved = true;
        order.updatedAt = Date.now();
        await order.save();

        await clearCart(cart);

        res.status(201).json({
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create order and payment link (Checkout PayOS)
router.post("/checkout/payos", verifyToken, async (req, res) => {
    try {
        const {
            shippingAddress,
            returnUrl,
            cancelUrl,
            description,
        } = req.body;

        const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);
        if (!isShippingAddressValid(normalizedShippingAddress)) {
            return res.status(400).json({ message: "Invalid shipping address" });
        }

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const finalReturnUrl = returnUrl || `${frontendUrl}/checkout/success`;
        const finalCancelUrl = cancelUrl || `${frontendUrl}/checkout`;

        if (!ensureValidUrl(finalReturnUrl) || !ensureValidUrl(finalCancelUrl)) {
            return res.status(400).json({ message: "Invalid returnUrl or cancelUrl" });
        }

        const { cart, error } = await ensureCartAndStock(req.userId);
        if (error) {
            return res.status(400).json({ message: error });
        }

        const orderCode = await generateUniqueOrderCode();
        const payOSItems = toPayOSItemsFromCart(cart);
        const amount = payOSItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid order amount for PayOS" });
        }

        const payload = {
            orderCode,
            amount,
            description: sanitizeDescription(description, orderCode),
            cancelUrl: finalCancelUrl,
            returnUrl: finalReturnUrl,
            items: payOSItems,
            buyerName: normalizedShippingAddress.name,
            buyerPhone: normalizedShippingAddress.phone,
            buyerAddress: normalizedShippingAddress.address,
        };

        const payOSResponse = await createPaymentLink(payload);
        if (payOSResponse?.code !== "00" || !payOSResponse?.data) {
            return res.status(502).json({
                message: "Cannot create payment link from PayOS",
                payos: payOSResponse,
            });
        }

        const order = new db.Order({
            user: req.userId,
            items: toOrderItemsFromCart(cart),
            totalAmount: amount,
            shippingAddress: normalizedShippingAddress,
            paymentMethod: "PAYOS",
            paymentStatus: "pending",
            payos: {
                orderCode,
                paymentLinkId: payOSResponse.data.paymentLinkId,
                checkoutUrl: payOSResponse.data.checkoutUrl,
                qrCode: payOSResponse.data.qrCode,
                status: payOSResponse.data.status || "PENDING",
            },
        });

        await order.save();

        await reserveInventory(order.items);
        order.inventoryReserved = true;
        order.updatedAt = Date.now();
        await order.save();

        await clearCart(cart);

        res.status(201).json({
            message: "PayOS payment link created successfully",
            order,
            payment: {
                orderCode,
                paymentLinkId: payOSResponse.data.paymentLinkId,
                checkoutUrl: payOSResponse.data.checkoutUrl,
                qrCode: payOSResponse.data.qrCode,
                status: payOSResponse.data.status,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Cannot create PayOS payment link",
            error: error.response?.data || error.message,
        });
    }
});

// Webhook from PayOS
router.post("/payos/webhook", async (req, res) => {
    try {
        const { data, signature, success } = req.body || {};

        if (!data || !signature) {
            return res.status(400).json({ message: "Invalid webhook payload" });
        }

        const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
        const isValidSignature = verifyWebhookSignature(data, signature, checksumKey);

        if (!isValidSignature) {
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        const orderCode = Number(data.orderCode);
        if (!Number.isFinite(orderCode)) {
            return res.status(400).json({ message: "Invalid orderCode from webhook" });
        }

        const order = await db.Order.findOne({ "payos.orderCode": orderCode });
        
        const inferredStatus =
            toUpperText(data.status) ||
            (success === true && data.code === "00" ? "PAID" : "CANCELLED");

        if (!order) {
            // Check if it's a subscription transaction
            const transaction = await db.Transaction.findOne({ payosOrderCode: String(orderCode) });
            if (transaction) {
                if (inferredStatus === "PAID") {
                    transaction.status = "success";
                    
                    if (transaction.type === "membership_fee" && transaction.note) {
                        const user = await db.User.findById(transaction.user);
                        if (user) {
                            user.subscriptionPlan = transaction.note; // e.g. 'silver', 'gold'
                            // Give them 1 month duration
                            const expiresAt = new Date();
                            expiresAt.setMonth(expiresAt.getMonth() + 1);
                            user.subscriptionExpiresAt = expiresAt;
                            
                            // Give them extra article credits
                            if (transaction.note === "silver") {
                                user.articleCredits = (user.articleCredits || 0) + 25;
                            } else if (transaction.note === "gold") {
                                user.articleCredits = (user.articleCredits || 0) + 999;
                            }

                            await user.save();
                        }
                    }
                } else if (["CANCELLED", "EXPIRED", "FAILED"].includes(inferredStatus)) {
                    transaction.status = "failed";
                }

                transaction.updatedAt = Date.now();
                await transaction.save();

                return res.status(200).json({ message: "Webhook processed for transaction" });
            }

            return res.status(200).json({ message: "Webhook received but order/transaction not found" });
        }


        await syncOrderStatusWithPayOS(order, inferredStatus);

        order.payos = {
            ...toPlainObject(order.payos),
            paymentLinkId: data.paymentLinkId || order.payos?.paymentLinkId,
            status: inferredStatus,
            lastWebhookData: data,
        };
        order.updatedAt = Date.now();
        await order.save();

        return res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Sync payment status from PayOS
router.get("/payos/:orderCode", verifyToken, async (req, res) => {
    try {
        const orderCode = Number(req.params.orderCode);
        if (!Number.isFinite(orderCode)) {
            return res.status(400).json({ message: "Invalid orderCode" });
        }

        const order = await db.Order.findOne({ "payos.orderCode": orderCode });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== req.userId && req.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const payOSResponse = await getPaymentLinkInfo(orderCode);
        if (payOSResponse?.code === "00" && payOSResponse?.data) {
            const payOSStatus = payOSResponse.data.status;

            await syncOrderStatusWithPayOS(order, payOSStatus);

            order.payos = {
                ...toPlainObject(order.payos),
                paymentLinkId: payOSResponse.data.id || order.payos?.paymentLinkId,
                status: payOSStatus,
            };
            order.updatedAt = Date.now();
            await order.save();
        }

        return res.status(200).json({
            order,
            payos: payOSResponse,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Cannot get payment status from PayOS",
            error: error.response?.data || error.message,
        });
    }
});

// Get user order history
router.get("/history", verifyToken, async (req, res) => {
    try {
        const orders = await db.Order.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .populate("items.product");

        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order by ID
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const order = await db.Order.findById(req.params.id).populate("items.product");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== req.userId && req.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel order
router.put("/:id/cancel", verifyToken, async (req, res) => {
    try {
        const order = await db.Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({ message: "Order already cancelled" });
        }

        if (order.status === "delivered") {
            return res.status(400).json({ message: "Cannot cancel delivered order" });
        }

        if (order.paymentMethod === "PAYOS" && order.payos?.orderCode && order.paymentStatus !== "paid") {
            try {
                const payOSCancelResponse = await cancelPaymentLink(order.payos.orderCode, "Cancelled by customer");
                order.payos = {
                    ...toPlainObject(order.payos),
                    status: payOSCancelResponse?.data?.status || "CANCELLED",
                };
            } catch (error) {
                // Continue local cancellation flow even if PayOS cancel call fails
            }
        }

        order.status = "cancelled";
        if (order.paymentMethod === "PAYOS" && order.paymentStatus !== "paid") {
            order.paymentStatus = "cancelled";
        }
        order.updatedAt = Date.now();

        await restoreInventory(order);
        await order.save();

        res.status(200).json({ message: "Order cancelled successfully", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (Admin only)
router.put("/:id/status", verifyToken, async (req, res) => {
    try {
        if (req.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { status } = req.body;

        const order = await db.Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders (Admin only)
router.get("/", verifyToken, async (req, res) => {
    try {
        if (req.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await db.Order.find(query)
            .populate("user", "name email")
            .populate("items.product")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await db.Order.countDocuments(query);

        res.status(200).json({
            orders,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
