const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();
const isServiceProviderRole = (role) => role === "service_provider" || role === "shop";
const getProviderOnboardingStatus = (user) => {
    if (!isServiceProviderRole(user?.role)) return undefined;
    if (user.providerOnboardingStatus) return user.providerOnboardingStatus;
    return user.isVerified ? "pending_legal_submission" : "pending_sale_approval";
};
const canProviderPublish = (user) =>
    isServiceProviderRole(user?.role) && user.isVerified && getProviderOnboardingStatus(user) === "approved";

const isSale = (req, res, next) => {
    if (req.role !== "sale") {
        return res.status(403).json({ message: "Access denied. Sale only." });
    }
    next();
};

// List service providers assigned to this sale
router.get("/service-providers", verifyToken, isSale, async (req, res) => {
    try {
        const providerDocs = await db.User.find({
            role: { $in: ["service_provider", "shop"] },
            managedBy: req.userId,
        })
            .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
            .sort({ createdAt: -1 });

        const providers = providerDocs.map((provider) => {
            const providerData = provider.toObject();
            const providerOnboardingStatus = getProviderOnboardingStatus(providerData);
            return {
                ...providerData,
                providerOnboardingStatus,
                canPublishServices: canProviderPublish(providerData),
            };
        });

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
            $or: [
                { isVerified: false },
                { providerOnboardingStatus: "pending_legal_approval" },
            ],
        })
            .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
            .sort({ createdAt: -1 });

        res.status(200).json({
            pendingProviders: pendingProviders.map((provider) => {
                const providerData = provider.toObject();
                return {
                    ...providerData,
                    providerOnboardingStatus: getProviderOnboardingStatus(providerData),
                };
            }),
        });
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

        const currentStatus = getProviderOnboardingStatus(provider);
        let message = "";
        let approvalStage = "";

        // Check if we can perform legal approval (even if technically in submission stage)
        const legal = provider.legalDocuments || {};
        const hasRequiredLegalInfo =
            typeof legal.clinicName === "string" && legal.clinicName.trim() &&
            typeof legal.clinicLicenseNumber === "string" && legal.clinicLicenseNumber.trim() &&
            (
                (typeof legal.clinicLicenseUrl === "string" && legal.clinicLicenseUrl.trim()) ||
                (typeof legal.businessLicenseUrl === "string" && legal.businessLicenseUrl.trim())
            );

        if (!provider.isVerified) {
            provider.isVerified = true;
            provider.providerOnboardingStatus = "pending_legal_submission";
            message = "Initial account approval completed. Provider can login and submit legal documents.";
            approvalStage = "initial_account";
        } else if (currentStatus === "pending_legal_approval" || (currentStatus === "pending_legal_submission" && hasRequiredLegalInfo)) {
            const hasPhone = typeof provider.phone === "string" && provider.phone.trim();
            const hasAddress = typeof provider.address === "string" && provider.address.trim();

            if (!hasPhone || !hasAddress) {
                return res.status(400).json({
                    message: "Provider must update phone and address before final approval.",
                });
            }

            if (!hasRequiredLegalInfo) {
                return res.status(400).json({
                    message: "Provider legal documents are incomplete. Make sure Clinic Name, License No, and at least one License file are present.",
                });
            }

            provider.providerOnboardingStatus = "approved";
            if (!provider.legalDocuments) {
                provider.legalDocuments = {};
            }
            provider.legalDocuments.reviewedAt = new Date();
            provider.legalDocuments.submittedAt = provider.legalDocuments.submittedAt || new Date(); 
            
            if (typeof req.body?.reviewNote === "string") {
                provider.legalDocuments.reviewNote = req.body.reviewNote.trim();
            }
            message = "Legal documents approved. Provider can now publish products/services.";
            approvalStage = "legal_documents";
        } else if (currentStatus === "pending_legal_submission") {
            return res.status(400).json({ message: "Provider has not submitted legal documents yet." });
        } else {
            return res.status(400).json({ message: "Provider is already fully approved." });
        }

        await provider.save();

        res.status(200).json({
            message,
            approvalStage,
            provider: {
                id: provider._id,
                name: provider.name,
                email: provider.email,
                role: provider.role,
                isVerified: provider.isVerified,
                providerOnboardingStatus: getProviderOnboardingStatus(provider),
                canPublishServices: canProviderPublish(provider),
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
