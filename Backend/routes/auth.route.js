const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../models");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../config/emailService");

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, saleCode, role = "user" } = req.body;
        
        const existingUser = await db.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const normalizedRole = role === "service_provider" ? "service_provider" : "user";

        // Service Provider registration requires sale code
        if (normalizedRole === "service_provider" && !saleCode) {
            return res.status(400).json({ message: "Sale ID is required for Service Provider account." });
        }

        // If sale code is provided, validate it exists
        if (saleCode) {
            const saleUser = await db.User.findOne({ 
                role: 'sale',
                saleCode: saleCode
            });
            
            if (!saleUser) {
                return res.status(400).json({ message: "Invalid sale code. Please check and try again." });
            }
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        
        const newUser = new db.User({
            email,
            password: hashedPassword,
            name,
            role: normalizedRole,
            // Service providers must be approved by sale; normal users auto-verified
            isVerified: normalizedRole === "service_provider" ? false : true
        });

        // Link to sale user if sale code provided
        if (saleCode) {
            const saleUser = await db.User.findOne({ 
                role: 'sale',
                saleCode: saleCode
            });
            
            newUser.saleCode = saleCode;
            newUser.managedBy = saleUser._id;
        }

        await newUser.save();

        res.status(201).json({
            message:
                normalizedRole === "service_provider"
                    ? "Service Provider account created. Waiting for sale approval."
                    : "User created successfully. You can now login.",
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                saleCode: newUser.saleCode
            }
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

        if ((user.role === "service_provider" || user.role === "shop") && !user.isVerified) {
            return res.status(403).json({
                message: "Your Service Provider account is pending sale approval."
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        res.status(200).json({ 
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify Email
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const user = await db.User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
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
