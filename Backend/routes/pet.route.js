const express = require("express");
const multer = require("multer");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { cloudinary } = require("../config/cloudinary");

// Add a generic Multer error handler for better diagnostics
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: "File is too heavy. Maximum size allowed is 5MB." });
        }
        return res.status(400).json({ message: `Upload protocol error: ${err.message}` });
    }
    next(err);
};

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/upload-avatar", verifyToken, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: "Portrait file too heavy. 5MB limit." });
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(500).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
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
                    folder: "pnetai/pets",
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
            message: "Avatar uploaded successfully",
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

router.get("/", verifyToken, async (req, res) => {
    try {
        const pets = await db.Pet.find({ user: req.userId }).sort({ createdAt: -1 });
        res.status(200).json({ pets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/", verifyToken, async (req, res) => {
    try {
        const {
            name,
            species = "Other",
            breed = "",
            gender = "Unknown",
            age = 0,
            birthday,
            weightKg = 0,
            isSpayed = false,
            healthStatus = "Healthy",
            allergies = "",
            medicalHistory = "",
            lastVisitDate,
            avatarUrl = "",
            notes = "",
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: "Pet name is required" });
        }

        const pet = new db.Pet({
            user: req.userId,
            name: name.trim(),
            species,
            breed,
            gender,
            age,
            birthday: birthday || undefined,
            weightKg,
            isSpayed,
            healthStatus,
            allergies,
            medicalHistory,
            lastVisitDate: lastVisitDate || undefined,
            avatarUrl,
            notes,
        });

        await pet.save();
        res.status(201).json({ message: "Pet created successfully", pet });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put("/:id", verifyToken, async (req, res) => {
    try {
        const pet = await db.Pet.findOne({ _id: req.params.id, user: req.userId });
        if (!pet) {
            return res.status(404).json({ message: "Pet not found" });
        }

        const fields = [
            "name",
            "species",
            "breed",
            "gender",
            "age",
            "birthday",
            "weightKg",
            "isSpayed",
            "healthStatus",
            "allergies",
            "medicalHistory",
            "lastVisitDate",
            "avatarUrl",
            "notes",
        ];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                pet[field] = req.body[field];
            }
        });

        pet.updatedAt = Date.now();
        await pet.save();

        res.status(200).json({ message: "Pet updated successfully", pet });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const deleted = await db.Pet.findOneAndDelete({ _id: req.params.id, user: req.userId });
        if (!deleted) {
            return res.status(404).json({ message: "Pet not found" });
        }
        res.status(200).json({ message: "Pet deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get pets for a specific user (Admin, Sale, or Provider only)
router.get("/user/:userId", verifyToken, async (req, res) => {
    try {
        if (req.role === 'user' && req.userId !== req.params.userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        const pets = await db.Pet.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json({ pets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
