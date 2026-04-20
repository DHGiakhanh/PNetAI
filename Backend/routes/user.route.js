const express = require("express");
const bcryptjs = require("bcryptjs");
const multer = require("multer");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { cloudinary } = require("../config/cloudinary");

const router = express.Router();
const isServiceProviderRole = (role) => role === "service_provider" || role === "shop";
const getProviderOnboardingStatus = (user) => {
    if (!isServiceProviderRole(user?.role)) return undefined;
    if (user.providerOnboardingStatus) return user.providerOnboardingStatus;
    return user.isVerified ? "pending_legal_submission" : "pending_sale_approval";
};
const canProviderPublish = (user) =>
    isServiceProviderRole(user?.role) && user.isVerified && getProviderOnboardingStatus(user) === "approved";
const allowedDocumentMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf"
]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
const fileExtensionByMimeType = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf"
};

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

// Upload legal document file for provider onboarding
router.post('/provider/upload-legal-file', verifyToken, (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: "Document too heavy. 5MB limit." });
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(500).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const user = await db.User.findById(req.userId).select("role isVerified providerOnboardingStatus");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!isServiceProviderRole(user.role)) {
            return res.status(403).json({ message: "Access denied. Service Provider only." });
        }

        if (!user.isVerified || getProviderOnboardingStatus(user) === "pending_sale_approval") {
            return res.status(403).json({
                message: "Your account has not passed initial sale approval yet.",
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: "File is required" });
        }

        if (!allowedDocumentMimeTypes.has(req.file.mimetype)) {
            return res.status(400).json({
                message: "Only image files (jpg, png, webp) are allowed.",
            });
        }

        const fileType = typeof req.body.fileType === "string" ? req.body.fileType : "";
        if (!["clinic_license", "business_license"].includes(fileType)) {
            return res.status(400).json({
                message: "fileType must be clinic_license or business_license.",
            });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const extension = fileExtensionByMimeType[req.file.mimetype] || "bin";
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `pnetai/legal-documents/${req.userId}`,
                    resource_type: "auto",
                    public_id: `${fileType}_${Date.now()}.${extension}`,
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

        return res.status(200).json({
            message: "Legal document uploaded successfully.",
            fileType,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            originalName: req.file.originalname,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
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

        const hasPhone = typeof user.phone === "string" && user.phone.trim();
        const hasAddress = typeof user.address === "string" && user.address.trim();
        if (!hasPhone || !hasAddress) {
            return res.status(400).json({
                message: "Please update phone and address in your profile before submitting legal documents.",
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
        const { 
            name, phone, address, avatarUrl, 
            description, clinicImages, doctors, 
            operatingHours, bookingCapacity,
            legalDocuments 
        } = req.body;
        
        const user = await db.User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
        if (description !== undefined) user.description = description;
        
        // Provider specific assets
        if (clinicImages) user.clinicImages = clinicImages;
        if (doctors) user.doctors = doctors;
        
        // Provider specific configs
        if (operatingHours) user.operatingHours = operatingHours;
        if (bookingCapacity !== undefined) user.bookingCapacity = bookingCapacity;

        // Legal information (if provided)
        if (legalDocuments) {
            user.legalDocuments = {
                ...user.legalDocuments,
                ...legalDocuments
            };

            // Auto-advance status if minimum required docs are present
            const legal = user.legalDocuments;
            if (user.providerOnboardingStatus === 'pending_legal_submission' && 
                legal.clinicName && 
                legal.clinicLicenseNumber && 
                (legal.clinicLicenseUrl || legal.businessLicenseUrl || legal.doctorLicenseUrl)) {
                
                user.providerOnboardingStatus = 'pending_legal_approval';
                if (!user.legalDocuments.submittedAt) {
                    user.legalDocuments.submittedAt = new Date();
                }
            }
        }

        await user.save();

        res.status(200).json({ 
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Content & Media Handling ---

// Unified Image Upload (Returns URL, does NOT update profile automatically)
router.post('/upload', verifyToken, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: "Image too heavy. 5MB limit." });
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(500).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided or invalid field name (expected 'image')" });
        }

        if (!req.file.mimetype?.startsWith("image/")) {
            return res.status(400).json({ message: "Invalid file type. Only standard image formats (JPG, PNG, WEBP) are supported." });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "pnetai/general",
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

        return res.status(200).json({
            message: "Image secured successfully",
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        return res.status(500).json({ message: "Media storage protocol failure: " + error.message });
    }
});

// Avatar Upload (Updates user profile automatically)
router.post('/upload-avatar', verifyToken, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: "Identity portrait too heavy. 5MB limit." });
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(500).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No portrait file provided" });
        }

        if (!req.file.mimetype?.startsWith("image/")) {
            return res.status(400).json({ message: "Portraits must be in image format (JPG, PNG, WEBP)." });
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

        const user = await db.User.findById(req.userId);
        if (user) {
            user.avatarUrl = uploadResult.secure_url;
            await user.save();
        }

        return res.status(200).json({
            message: "Identity portrait updated successfully",
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        return res.status(500).json({ message: "Portrait storage protocol failure: " + error.message });
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
