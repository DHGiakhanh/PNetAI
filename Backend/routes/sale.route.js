const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

const isSale = (req, res, next) => {
    if (req.role !== "sale") {
        return res.status(403).json({ message: "Access denied. Sale only." });
    }
    next();
};

// List service providers assigned to this sale
router.get("/service-providers", verifyToken, isSale, async (req, res) => {
    try {
        const providers = await db.User.find({
            role: { $in: ["service_provider", "shop"] },
            managedBy: req.userId,
        })
            .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
            .sort({ createdAt: -1 });

        res.status(200).json({ providers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// List pending service providers awaiting sale approval
router.get("/service-providers/pending", verifyToken, isSale, async (req, res) => {
    try {
        const pendingProviders = await db.User.find({
            role: { $in: ["service_provider", "shop"] },
            managedBy: req.userId,
            isVerified: false,
        })
            .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
            .sort({ createdAt: -1 });

        res.status(200).json({ pendingProviders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve service provider account
router.put("/service-providers/:id/approve", verifyToken, isSale, async (req, res) => {
    try {
        const provider = await db.User.findOne({
            _id: req.params.id,
            role: { $in: ["service_provider", "shop"] },
            managedBy: req.userId,
        });

        if (!provider) {
            return res.status(404).json({ message: "Service provider not found" });
        }

        provider.isVerified = true;
        await provider.save();

        res.status(200).json({
            message: "Service provider approved successfully",
            provider: {
                id: provider._id,
                name: provider.name,
                email: provider.email,
                role: provider.role,
                isVerified: provider.isVerified,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

