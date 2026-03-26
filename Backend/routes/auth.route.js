const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../models");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../config/emailService");
const verifyToken = require("../middlewares/verifyToken");
const { generateCustomerCode } = require("../config/customerCode");

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, saleCode } = req.body;
        
        const existingUser = await db.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
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
            role: 'petowner', // Explicitly set to petowner
            isVerified: true, // Auto-verify users
            customerCode: generateCustomerCode()
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
            message: "User created successfully. You can now login.",
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name,
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
                role: user.role,
                partnerType: user.partnerType,
                isVerified: user.isVerified,
                customerCode: user.customerCode,
                saleCode: user.saleCode,
                managedBy: user.managedBy
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Partner Registration (Service Provider)
router.post('/register-partner', async (req, res) => {
    try {
        const { email, password, name, phone, address, partnerType, businessName } = req.body;
        
        if (!partnerType || !['vet', 'spa', 'shop'].includes(partnerType)) {
            return res.status(400).json({ message: "Valid partner type (vet, spa, shop) is required" });
        }

        const existingUser = await db.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        
        const newPartner = new db.User({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            role: 'serviceprovider',
            partnerType,
            isVerified: false, // Partners need verification
            customerCode: generateCustomerCode()
        });

        await newPartner.save();

        // Create partner application for verification
        const partnerApplication = new db.PartnerApplication({
            user: newPartner._id,
            businessName: businessName || name,
            partnerType,
            email,
            phone,
            status: 'submitted'
        });
        
        await partnerApplication.save();

        res.status(201).json({
            message: "Partner registration submitted successfully. Please wait for verification.",
            user: {
                id: newPartner._id,
                email: newPartner.email,
                name: newPartner.name,
                role: newPartner.role,
                partnerType: newPartner.partnerType,
                isVerified: newPartner.isVerified
            },
            applicationId: partnerApplication._id
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

// Get current authenticated user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await db.User.findById(req.userId).select(
      "-password -verificationToken -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
