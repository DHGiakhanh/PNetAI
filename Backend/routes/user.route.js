const express = require("express");
const bcryptjs = require("bcryptjs");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();
const isServiceProviderRole = (role) => role === "service_provider" || role === "shop";
const getProviderOnboardingStatus = (user) => {
    if (!isServiceProviderRole(user?.role)) return undefined;
    if (user.providerOnboardingStatus) return user.providerOnboardingStatus;
    return user.isVerified ? "approved" : "pending_sale_approval";
};
const canProviderPublish = (user) =>
    isServiceProviderRole(user?.role) && user.isVerified && getProviderOnboardingStatus(user) === "approved";

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await db.User.findById(req.userId).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = user.toObject();
        const providerOnboardingStatus = getProviderOnboardingStatus(userData);
        if (providerOnboardingStatus) {
            userData.providerOnboardingStatus = providerOnboardingStatus;
            userData.canPublishServices = canProviderPublish(userData);
        }

        res.status(200).json({ user: userData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit legal documents for service provider onboarding
router.post('/provider/legal-documents', verifyToken, async (req, res) => {
    try {
        const user = await db.User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!isServiceProviderRole(user.role)) {
            return res.status(403).json({ message: "Access denied. Service Provider only." });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Your account is still waiting for first sale approval.",
            });
        }

        const currentStatus = getProviderOnboardingStatus(user);
        if (currentStatus === "approved") {
            return res.status(400).json({ message: "Legal documents already approved." });
        }

        if (currentStatus === "pending_sale_approval") {
            return res.status(400).json({
                message: "Your account has not passed initial sale approval yet.",
            });
        }

        const { clinicName, clinicLicenseNumber, clinicLicenseUrl, businessLicenseUrl, note } = req.body;

        if (!clinicName || !clinicLicenseNumber || !clinicLicenseUrl) {
            return res.status(400).json({
                message: "clinicName, clinicLicenseNumber and clinicLicenseUrl are required.",
            });
        }

        user.legalDocuments = {
            clinicName: String(clinicName).trim(),
            clinicLicenseNumber: String(clinicLicenseNumber).trim(),
            clinicLicenseUrl: String(clinicLicenseUrl).trim(),
            businessLicenseUrl: businessLicenseUrl ? String(businessLicenseUrl).trim() : "",
            submissionNote: note ? String(note).trim() : "",
            submittedAt: new Date(),
            reviewedAt: undefined,
            reviewNote: undefined,
        };
        user.providerOnboardingStatus = "pending_legal_approval";
        await user.save();

        res.status(200).json({
            message: "Legal documents submitted successfully. Waiting for sale approval.",
            providerOnboardingStatus: user.providerOnboardingStatus,
            legalDocuments: user.legalDocuments,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update User Profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        
        const user = await db.User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        res.status(200).json({ 
            message: "Profile updated successfully",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address,
                role: user.role,
                saleCode: user.saleCode,
                providerOnboardingStatus: getProviderOnboardingStatus(user),
                canPublishServices: canProviderPublish(user),
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Change Password
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        const user = await db.User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
