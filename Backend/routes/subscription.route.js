const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { createPaymentLink } = require("../utils/payos");

const router = express.Router();

const generateOrderCode = () => {
    const random = Math.floor(Math.random() * 900) + 100;
    return Number(`${Date.now()}${random}`);
};

const generateUniqueOrderCode = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const orderCode = generateOrderCode();
        const existingTx = await db.Transaction.exists({ payosOrderCode: orderCode });
        if (!existingTx) {
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

const PLAN_PRICES = {
    silver: {
        priceUSD: 2,
        priceVND: 50000, 
        name: "Silver Tier",
    },
    gold: {
        priceUSD: 4,
        priceVND: 100000,
        name: "Gold Tier",
    }
};

// Create subscription payment link (Checkout PayOS)
router.post("/checkout/payos", verifyToken, async (req, res) => {
    try {
        const { planId, returnUrl, cancelUrl } = req.body;

        const plan = PLAN_PRICES[planId];
        if (!plan) {
            return res.status(400).json({ message: "Invalid planId. Must be silver or gold." });
        }

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const finalReturnUrl = returnUrl || `${frontendUrl}/service-provider/subscription/success`;
        const finalCancelUrl = cancelUrl || `${frontendUrl}/service-provider/subscription/cancel`;

        if (!ensureValidUrl(finalReturnUrl) || !ensureValidUrl(finalCancelUrl)) {
            return res.status(400).json({ message: "Invalid returnUrl or cancelUrl" });
        }

        const user = await db.User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Avoid downgrading or subscribing to same tier if we don't want them to, 
        // but let's allow it per request logic or default to fine.
        if (user.subscriptionPlan === planId) {
            return res.status(400).json({ message: "You are already subscribed to this plan." });
        }

        const orderCode = await generateUniqueOrderCode();
        const amount = plan.priceVND;

        const payload = {
            orderCode,
            amount,
            description: `SUB ${orderCode}`.slice(0, 25),
            cancelUrl: finalCancelUrl,
            returnUrl: finalReturnUrl,
            items: [
                {
                    name: plan.name,
                    quantity: 1,
                    price: amount,
                }
            ],
            buyerName: user.name || "Customer",
            buyerPhone: user.phone || "0000000000",
            buyerAddress: user.address || "Vietnam",
        };

        const payOSResponse = await createPaymentLink(payload);
        if (payOSResponse?.code !== "00" || !payOSResponse?.data) {
            return res.status(502).json({
                message: "Cannot create payment link from PayOS",
                payos: payOSResponse,
            });
        }

        const transaction = new db.Transaction({
            user: req.userId,
            type: "membership_fee",
            amount: amount,
            status: "pending",
            paymentMethod: "PayOS",
            payosOrderCode: orderCode,
            note: planId, // Storing planId in note for webhook to retrieve
        });

        await transaction.save();

        res.status(201).json({
            message: "PayOS payment link created successfully",
            transaction,
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
            message: "Cannot create PayOS payment link for subscription",
            error: error.response?.data || error.message,
        });
    }
});

module.exports = router;
