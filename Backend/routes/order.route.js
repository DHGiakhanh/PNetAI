const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const {
    createPaymentLink,
    getPaymentLinkInfo,
    cancelPaymentLink,
    verifyWebhookSignature,
} = require("../utils/payos");
const { removeMissingProductsFromCart } = require("../utils/cart");

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

const isProviderRole = (role) => role === "service_provider" || role === "shop";

const getProviderOnboardingStatus = (user) => {
    if (!isProviderRole(user?.role)) return undefined;
    if (user.providerOnboardingStatus) return user.providerOnboardingStatus;
    return user.isVerified ? "pending_legal_submission" : "pending_sale_approval";
};

const canProviderOperate = (user) =>
    isProviderRole(user?.role) &&
    user.isVerified &&
    getProviderOnboardingStatus(user) === "approved";

const ensureProviderFullyApproved = async (req, res, next) => {
    try {
        const provider = await db.User.findById(req.userId).select("role isVerified providerOnboardingStatus");
        if (!provider || !isProviderRole(provider.role)) {
            return res.status(403).json({ message: "Access denied. Service Provider only." });
        }

        if (!canProviderOperate(provider)) {
            return res.status(403).json({
                message: "Upload legal documents and wait for approval before accessing order management.",
                code: "PROVIDER_NOT_READY",
                providerOnboardingStatus: getProviderOnboardingStatus(provider),
            });
        }

        return next();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const parseDateBoundary = (input, endOfDay = false) => {
    if (!input || typeof input !== "string") return null;

    let parsed = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [yearStr, monthStr, dayStr] = input.split("-");
        parsed = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
    } else {
        const candidate = new Date(input);
        if (!Number.isNaN(candidate.getTime())) {
            parsed = candidate;
        }
    }

    if (!parsed || Number.isNaN(parsed.getTime())) return null;

    if (endOfDay) {
        parsed.setHours(23, 59, 59, 999);
    } else {
        parsed.setHours(0, 0, 0, 0);
    }

    return parsed;
};

const serializeProviderOrder = (order, providerId) => {
    const rawOrder = typeof order.toObject === "function" ? order.toObject() : order;
    const providerIdStr = String(providerId);
    const allItems = Array.isArray(rawOrder.items) ? rawOrder.items : [];

    const providerItems = allItems
        .filter((item) => {
            const productProviderId = item?.product?.providerId?._id || item?.product?.providerId;
            return productProviderId && String(productProviderId) === providerIdStr;
        })
        .map((item) => ({
            productId: item?.product?._id || item?.product || null,
            name: item?.name || item?.product?.name || "Product",
            quantity: Number(item?.quantity || 0),
            price: Number(item?.price || 0),
            image: item?.product?.images?.[0] || null,
            category: item?.product?.category || "",
            lineTotal: Number(item?.price || 0) * Number(item?.quantity || 0),
        }));

    const providerSubtotal = providerItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const hasForeignItems = allItems.some((item) => {
        const productProviderId = item?.product?.providerId?._id || item?.product?.providerId;
        return !productProviderId || String(productProviderId) !== providerIdStr;
    });

    return {
        _id: rawOrder._id,
        status: rawOrder.status,
        paymentMethod: rawOrder.paymentMethod,
        paymentStatus: rawOrder.paymentStatus,
        totalAmount: rawOrder.totalAmount,
        providerSubtotal,
        providerItemCount: providerItems.reduce((sum, item) => sum + item.quantity, 0),
        providerItems,
        createdAt: rawOrder.createdAt,
        updatedAt: rawOrder.updatedAt,
        paidAt: rawOrder.paidAt,
        shippingAddress: rawOrder.shippingAddress,
        user: rawOrder.user,
        hasForeignItems,
        canManageStatus: !hasForeignItems,
        payos: rawOrder.payos
            ? {
                orderCode: rawOrder.payos.orderCode,
                status: rawOrder.payos.status,
            }
            : null,
    };
};

const ensureCartAndStock = async (userId) => {
    let cart = await db.Cart.findOne({ user: userId }).populate("items.product");
    cart = await removeMissingProductsFromCart(cart);

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

const createProductOrderTransactions = async (order) => {
    const existingTx = await db.Transaction.exists({
        referenceId: order._id,
        type: "product_order",
    });
    if (existingTx) {
        return;
    }

    const productIds = order.items.map((item) => item.product).filter(Boolean);
    if (productIds.length === 0) {
        return;
    }

    const products = await db.Product.find({ _id: { $in: productIds } }).select("_id providerId");
    const providerMap = new Map(
        products.map((product) => [String(product._id), product.providerId ? String(product.providerId) : null])
    );

    const providerRevenueMap = new Map();
    for (const item of order.items) {
        const providerId = providerMap.get(String(item.product));
        if (!providerId) continue;

        const lineAmount = Number(item.price || 0) * Number(item.quantity || 0);
        providerRevenueMap.set(providerId, (providerRevenueMap.get(providerId) || 0) + lineAmount);
    }

    const payloads = Array.from(providerRevenueMap.entries())
        .filter(([, amount]) => amount > 0)
        .map(([providerId, amount]) => ({
            user: order.user,
            type: "product_order",
            provider: providerId,
            amount,
            status: "success",
            paymentMethod: order.paymentMethod,
            payosOrderCode: order.payos?.orderCode ? String(order.payos.orderCode) : undefined,
            referenceId: order._id,
            note: "Product order payment",
        }));

    if (payloads.length > 0) {
        await db.Transaction.insertMany(payloads);
    }
};

const syncOrderStatusWithPayOS = async (order, payOSStatus) => {
    const normalizedStatus = toUpperText(payOSStatus);

    if (!normalizedStatus) {
        return;
    }

    if (normalizedStatus === "PAID") {
        if (order.paymentStatus !== "paid") {
            await createProductOrderTransactions(order);
        }
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
            // Check if it's a subscription or booking transaction
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

                    // Notify provider on successful payment - wait for manual approval
                    if (transaction.type === "service_booking" && transaction.referenceId) {
                        const booking = await db.Booking.findById(transaction.referenceId)
                            .populate({
                                path: 'service',
                                select: 'title providerId'
                            })
                            .populate('user', 'name');
                            
                        if (booking && booking.status === "pending") {
                            // Update booking status to confirmed upon successful payment
                            booking.status = "confirmed";
                            await booking.save();

                            // Fetch full provider details for email
                            const service = await db.Service.findById(booking.service._id || booking.service)
                                .populate('providerId', 'email');
                            
                            if (service && service.providerId && service.providerId.email) {
                                const { sendNewBookingNotificationToProvider } = require("../config/emailService");
                                await sendNewBookingNotificationToProvider(service.providerId.email, {
                                    serviceTitle: service.title,
                                    customerName: booking.user.name || "Customer",
                                    petName: "Your Patient", // We can improve this by populating pet
                                    date: booking.bookingDate.toLocaleDateString(),
                                    time: booking.bookingTime,
                                    totalAmount: booking.totalAmount
                                });
                            }
                        }
                    }
                } else if (["CANCELLED", "EXPIRED", "FAILED"].includes(inferredStatus)) {
                    transaction.status = "failed";

                    // Cancel pending booking on payment failure
                    if (transaction.type === "service_booking" && transaction.referenceId) {
                        const booking = await db.Booking.findById(transaction.referenceId);
                        if (booking && booking.status === "pending") {
                            booking.status = "cancelled";
                            booking.updatedAt = Date.now();
                            await booking.save();
                        }
                    }
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

// Provider monthly product revenue summary
router.get("/provider/product-revenue", verifyToken, async (req, res) => {
    try {
        if (!["service_provider", "shop", "admin"].includes(req.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const now = new Date();
        const monthInput = Number(req.query.month);
        const yearInput = Number(req.query.year);
        const monthIndex = Number.isInteger(monthInput) && monthInput >= 1 && monthInput <= 12
            ? monthInput - 1
            : now.getMonth();
        const year = Number.isInteger(yearInput) ? yearInput : now.getFullYear();

        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 1);

        const providerProducts = await db.Product.find({ providerId: req.userId }).select("_id");
        const productIds = providerProducts.map((item) => item._id);

        if (productIds.length === 0) {
            return res.status(200).json({
                month: monthIndex + 1,
                year,
                productRevenue: 0,
                unitsSold: 0,
                ordersCount: 0,
            });
        }

        const summary = await db.Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" },
                    $or: [
                        { paymentStatus: "paid" },
                        {
                            paymentMethod: "COD",
                            status: { $in: ["processing", "shipped", "delivered"] },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    revenueDate: { $ifNull: ["$paidAt", "$createdAt"] },
                },
            },
            {
                $match: {
                    revenueDate: { $gte: startDate, $lt: endDate },
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.product": { $in: productIds },
                },
            },
            {
                $group: {
                    _id: null,
                    productRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    unitsSold: { $sum: "$items.quantity" },
                    orderIds: { $addToSet: "$_id" },
                },
            },
            {
                $project: {
                    _id: 0,
                    productRevenue: 1,
                    unitsSold: 1,
                    ordersCount: { $size: "$orderIds" },
                },
            },
        ]);

        const result = summary[0] || { productRevenue: 0, unitsSold: 0, ordersCount: 0 };

        return res.status(200).json({
            month: monthIndex + 1,
            year,
            productRevenue: result.productRevenue || 0,
            unitsSold: result.unitsSold || 0,
            ordersCount: result.ordersCount || 0,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Provider orders list
router.get("/provider/orders", verifyToken, ensureProviderFullyApproved, async (req, res) => {
    try {
        const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
        const dateFrom = parseDateBoundary(req.query.dateFrom, false);
        const dateTo = parseDateBoundary(req.query.dateTo, true);

        const providerProducts = await db.Product.find({ providerId: req.userId }).select("_id");
        const productIds = providerProducts.map((item) => item._id);

        if (productIds.length === 0) {
            return res.status(200).json({
                orders: [],
                pagination: {
                    total: 0,
                    page,
                    pages: 0,
                    limit,
                },
            });
        }

        const query = {
            "items.product": { $in: productIds },
        };

        if (status) {
            query.status = status;
        }

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = dateFrom;
            if (dateTo) query.createdAt.$lte = dateTo;
        }

        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            db.Order.find(query)
                .populate("user", "name email phone")
                .populate("items.product", "name images category providerId")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            db.Order.countDocuments(query),
        ]);

        return res.status(200).json({
            orders: orders
                .map((order) => serializeProviderOrder(order, req.userId))
                .filter((order) => order.providerItems.length > 0),
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Provider order details
router.get("/provider/orders/:id", verifyToken, ensureProviderFullyApproved, async (req, res) => {
    try {
        const order = await db.Order.findById(req.params.id)
            .populate("user", "name email phone")
            .populate("items.product", "name images category providerId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const normalizedOrder = serializeProviderOrder(order, req.userId);
        if (normalizedOrder.providerItems.length === 0) {
            return res.status(404).json({ message: "Order not found for this provider" });
        }

        return res.status(200).json({ order: normalizedOrder });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// Provider order status update
router.patch("/provider/orders/:id/status", verifyToken, ensureProviderFullyApproved, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["processing", "shipped", "delivered", "cancelled"];
        const allowedTransitions = {
            pending: ["processing", "cancelled"],
            processing: ["shipped", "cancelled"],
            shipped: ["delivered"],
            delivered: [],
            cancelled: [],
        };

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status." });
        }

        const order = await db.Order.findById(req.params.id)
            .populate("user", "name email phone")
            .populate("items.product", "name images category providerId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const normalizedOrder = serializeProviderOrder(order, req.userId);
        if (normalizedOrder.providerItems.length === 0) {
            return res.status(404).json({ message: "Order not found for this provider" });
        }

        if (!normalizedOrder.canManageStatus) {
            return res.status(409).json({
                message: "This order contains products from multiple providers, so only admins can update its global status.",
                code: "MULTI_PROVIDER_ORDER",
            });
        }

        const currentStatus = order.status || "pending";
        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                message: `Cannot move order from '${currentStatus}' to '${status}'.`,
            });
        }

        if (status === "cancelled" && order.paymentMethod === "PAYOS" && order.payos?.orderCode && order.paymentStatus !== "paid") {
            try {
                const payOSCancelResponse = await cancelPaymentLink(order.payos.orderCode, "Cancelled by provider");
                order.payos = {
                    ...toPlainObject(order.payos),
                    status: payOSCancelResponse?.data?.status || "CANCELLED",
                };
            } catch (error) {
                // Keep local cancellation flow even if PayOS cancellation fails.
            }
        }

        order.status = status;
        order.updatedAt = Date.now();

        if (status === "cancelled") {
            if (order.paymentMethod === "PAYOS" && order.paymentStatus !== "paid") {
                order.paymentStatus = "cancelled";
            }
            await restoreInventory(order);
        }

        await order.save();

        return res.status(200).json({
            message: "Order status updated",
            order: serializeProviderOrder(order, req.userId),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
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

// Request return
router.post("/:id/return-request", verifyToken, async (req, res) => {
    try {
        const order = await db.Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Only allow return if paid or delivered (case-insensitive check)
        const allowedStatus = ["paid", "delivered", "confirmed", "completed", "success"];
        const currentStatus = order.status ? order.status.toLowerCase() : "";
        const currentPaymentStatus = order.paymentStatus ? order.paymentStatus.toLowerCase() : "";

        if (!allowedStatus.includes(currentStatus) && currentPaymentStatus !== "paid") {
             return res.status(400).json({ 
                 message: `Order status '${order.status}' is not eligible for return`,
                 status: order.status
             });
        }

        order.status = "return_requested";
        await order.save();

        // Create Admin Notification
        await db.Notification.create({
            user: "admin",
            type: "refund_request",
            title: "Product Return Request",
            message: `User requested a return for order ORD-${order._id.slice(-6).toUpperCase()}. Value: ${order.totalPrice.toLocaleString()} VND`,
            relatedId: order._id,
        });

        res.status(200).json({ message: "Return request submitted successfully", order });
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
