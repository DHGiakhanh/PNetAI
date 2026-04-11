const express = require("express");
const bcryptjs = require("bcryptjs");
const multer = require("multer");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { cloudinary } = require("../config/cloudinary");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await db.User.findById(req.userId).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update User Profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, phone, address, avatarUrl } = req.body;
        
        const user = await db.User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        await user.save();

        res.status(200).json({ 
            message: "Profile updated successfully",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                address: user.address,
                avatarUrl: user.avatarUrl
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload User Avatar
router.post('/upload-avatar', verifyToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Image file is required" });
        }

        if (!req.file.mimetype?.startsWith("image/")) {
            return res.status(400).json({ message: "Only image files are allowed" });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "pnetai/avatars",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Optionally update the user profile immediately
        const user = await db.User.findById(req.userId);
        if (user) {
            user.avatarUrl = uploadResult.secure_url;
            await user.save();
        }

        return res.status(200).json({
            message: "Avatar uploaded successfully",
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
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
