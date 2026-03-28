const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

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
            weightKg = 0,
            healthStatus = "Healthy",
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
            weightKg,
            healthStatus,
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
            "weightKg",
            "healthStatus",
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

module.exports = router;
