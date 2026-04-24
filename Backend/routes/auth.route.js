const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const { OAuth2Client } = require('google-auth-library');
const db = require("../models");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../config/emailService");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();
const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const isServiceProviderRole = (role) => role === "service_provider" || role === "shop";

const getProviderOnboardingStatus = (user) => {
    if (!isServiceProviderRole(user?.role)) return undefined;
    if (user.providerOnboardingStatus) return user.providerOnboardingStatus;
    return user.isVerified ? "pending_legal_submission" : "pending_sale_approval";
};

const canProviderPublish = (user) => {
    if (!isServiceProviderRole(user?.role)) return false;
    if (!user.isVerified) return false;
    return getProviderOnboardingStatus(user) === "approved";
};

const findBalancedSaleAssignee = async () => {
    const saleUsers = await db.User.find({ role: "sale" }).select("_id saleCode createdAt");
    if (saleUsers.length === 0) {
        return null;
    }

    const assignmentLoads = await db.User.aggregate([
        {
            $match: {
                role: { $in: ["service_provider", "shop"] },
                managedBy: { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: "$managedBy",
                totalProviders: { $sum: 1 },
            },
        },
    ]);

    const loadMap = new Map(assignmentLoads.map((item) => [String(item._id), item.totalProviders]));
    const loads = saleUsers.map((sale) => loadMap.get(String(sale._id)) ?? 0);
    const minLoad = Math.min(...loads);
    const leastLoadedSales = saleUsers.filter((sale) => (loadMap.get(String(sale._id)) ?? 0) === minLoad);

    const randomIndex = Math.floor(Math.random() * leastLoadedSales.length);
    return leastLoadedSales[randomIndex];
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, saleCode, role = "user" } = req.body;
        
        const existingUser = await db.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const normalizedRole = role === "service_provider" ? "service_provider" : "user";
        const normalizedSaleCode = typeof saleCode === "string" ? saleCode.trim() : "";
        let assignedSale = null;
        let isAutoAssignedSale = false;

        if (normalizedRole === "service_provider") {
            if (normalizedSaleCode) {
                assignedSale = await db.User.findOne({
                    role: "sale",
                    saleCode: normalizedSaleCode,
                }).select("_id saleCode");

                if (!assignedSale) {
                    return res.status(400).json({ message: "Invalid sale code. Please check and try again." });
                }
            } else {
                assignedSale = await findBalancedSaleAssignee();
                if (!assignedSale) {
                    return res.status(400).json({ message: "No sale account available for assignment yet." });
                }
                isAutoAssignedSale = true;
            }
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const emailVerificationOtp = normalizedRole === "user" ? generateOtpCode() : undefined;
        
        const newUser = new db.User({
            email,
            password: hashedPassword,
            name,
            role: normalizedRole,
            // Users must verify email. Service providers must be approved by sale.
            isVerified: false,
            providerOnboardingStatus:
                normalizedRole === "service_provider" ? "pending_sale_approval" : undefined,
            verificationToken: emailVerificationOtp,
            verificationTokenExpires:
                normalizedRole === "user" ? new Date(Date.now() + 10 * 60 * 1000) : undefined
        });

        // Link to sale user if service provider
        if (normalizedRole === "service_provider" && assignedSale) {
            newUser.saleCode = assignedSale.saleCode || assignedSale._id.toString();
            newUser.managedBy = assignedSale._id;
        }

        await newUser.save();

        let verificationEmailSent = true;
        if (normalizedRole === "user" && emailVerificationOtp) {
            try {
                await sendVerificationEmail(newUser.email, emailVerificationOtp);
            } catch (emailError) {
                console.error("Failed to send verification email:", emailError.message);
                verificationEmailSent = false;
            }
        }

        res.status(201).json({
            message:
                normalizedRole === "user"
                    ? verificationEmailSent
                        ? "Account created. We sent a 6-digit verification code to your email."
                        : "Account created but email delivery failed. Please use Resend OTP on verification screen."
                    : normalizedRole === "service_provider"
                        ? isAutoAssignedSale
                            ? `Service Provider account created. Automatically assigned to sale ${newUser.saleCode}. Waiting for sale approval.`
                            : "Service Provider account created. Waiting for sale approval."
                        : "User created successfully. You can now login.",
            requiresEmailVerification: normalizedRole === "user",
            verificationEmailSent: normalizedRole === "user" ? verificationEmailSent : undefined,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                saleCode: newUser.saleCode,
                providerOnboardingStatus: newUser.providerOnboardingStatus,
            },
            assignmentMode: normalizedRole === "service_provider" ? (isAutoAssignedSale ? "auto" : "manual") : undefined,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await db.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // --- Inactivity & Status Check ---
        if (user.status === "locked") {
            return res.status(403).json({ message: "Your account is locked for security. Please contact support." });
        }

        user.lastLoginAt = new Date();
        
        if (user.status === "inactive") {
            const otpCode = generateOtpCode();
            user.reactivationToken = otpCode;
            user.reactivationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
            await user.save();
            
            try {
                await sendVerificationEmail(user.email, otpCode);
            } catch (err) {
                console.error("Reactivation email failed:", err.message);
            }

            return res.status(200).json({ 
                requiresReactivation: true,
                email: user.email,
                message: "You haven't used PNetAI for a long time, your account is temporarily locked for security. We sent a reactivation code to your email." 
            });
        }

        await user.save();

        if (user.role === "user" && !user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in."
            });
        }

        if (isServiceProviderRole(user.role) && !user.isVerified) {
            return res.status(403).json({
                message: "Your Service Provider account is pending sale approval."
            });
        }

        const providerOnboardingStatus = getProviderOnboardingStatus(user);
        const providerCanPublish = canProviderPublish(user);

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        res.status(200).json({ 
            message:
                isServiceProviderRole(user.role) && !providerCanPublish
                    ? "Login successful. Complete legal documents and wait for sale approval to publish services/products."
                    : "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                saleCode: user.saleCode,
                providerOnboardingStatus,
                canPublishServices: isServiceProviderRole(user.role) ? providerCanPublish : undefined,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Google Login
router.post('/google-login', async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ message: "Google Access Token is required" });

        // Verify and get user info from Google
        const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        const { email, name, picture, sub: googleId } = googleRes.data;

        if (!email) {
            return res.status(400).json({ message: "Could not retrieve email from Google account." });
        }

        let user = await db.User.findOne({ email });

        if (!user) {
            // Create user if not exists
            const rawPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcryptjs.hash(rawPassword, 10);
            
            user = new db.User({
                email,
                name,
                avatarUrl: picture,
                googleId,
                isVerified: true, // Google accounts are verified
                password: hashedPassword,
                role: "user"
            });
            await user.save();
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.avatarUrl) user.avatarUrl = picture;
                user.isVerified = true;
                await user.save();
            }
        }

        // --- Inactivity & Status Check for Google Login ---
        if (user.status === "locked") {
            return res.status(403).json({ message: "Your account is locked for security. Please contact support." });
        }

        user.lastLoginAt = new Date();
        
        if (user.status === "inactive") {
            const otpCode = generateOtpCode();
            user.reactivationToken = otpCode;
            user.reactivationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();
            
            try {
                await sendVerificationEmail(user.email, otpCode);
            } catch (err) {
                console.error("Reactivation email failed:", err.message);
            }

            return res.status(200).json({ 
                requiresReactivation: true,
                email: user.email,
                message: "Long time no see! Your account was inactive. Please verify it's you via the code sent to your email."
            });
        }

        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        res.status(200).json({ 
            message: "Google login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
                saleCode: user.saleCode,
                providerOnboardingStatus: getProviderOnboardingStatus(user),
                canPublishServices: isServiceProviderRole(user.role) ? canProviderPublish(user) : undefined,
            },
        });
    } catch (error) {
        console.error("Google Login Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Google authentication failed. Please try again." });
    }
});

// Verify Email by OTP (for user registration)
router.post('/verify-email-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({ message: "OTP must be a 6-digit code." });
        }

        const user = await db.User.findOne({ email, role: "user" });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: "Email already verified. You can login now." });
        }

        if (!user.verificationToken || !user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
            return res.status(400).json({ message: "OTP is expired. Please request a new code." });
        }

        if (user.verificationToken !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP code." });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Resend verification OTP (only for user)
router.post('/resend-verification-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await db.User.findOne({ email, role: "user" });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified." });
        }

        const otpCode = generateOtpCode();
        user.verificationToken = otpCode;
        user.verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(user.email, otpCode);

        res.status(200).json({ message: "A new verification code has been sent to your email." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify Reactivation (for inactive users)
router.post('/verify-reactivation', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        const user = await db.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.status !== "inactive") {
            return res.status(400).json({ message: "Account is already active." });
        }

        if (!user.reactivationToken || !user.reactivationTokenExpires || user.reactivationTokenExpires < new Date()) {
            return res.status(400).json({ message: "OTP is expired. Please try logging in again to request a new code." });
        }

        if (user.reactivationToken !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP code." });
        }

        user.status = "active";
        user.reactivationToken = undefined;
        user.reactivationTokenExpires = undefined;
        user.lastLoginAt = new Date();
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        res.status(200).json({ 
            message: "Account reactivated successfully. Welcome back!", 
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
                saleCode: user.saleCode,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Legacy verify by link token (kept for backward compatibility)
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { email } = req.query;

        if (/^\d{6}$/.test(token) && !email) {
            return res.status(400).json({ message: "Email query is required for OTP verification links." });
        }

        const query = {
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() },
        };

        if (email) {
            query.email = email;
        }

        const user = await db.User.findOne(query);
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await db.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: "Password reset email sent successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await db.User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/logout', async (req, res) => {
    try {
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
