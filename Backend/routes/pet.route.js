const express = require("express");
const db = require("../models");
const { requireAuth } = require("../middlewares/rbac");

const router = express.Router();

// List my pets
router.get("/", requireAuth, async (req, res) => {
  try {
    const pets = await db.Pet.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ pets });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create pet + initial EHR
router.post("/", requireAuth, async (req, res) => {
  try {
    const pet = new db.Pet({
      ...req.body,
      owner: req.userId,
      updatedAt: Date.now()
    });
    await pet.save();
    res.status(201).json({ message: "Pet created", pet });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get pet (owner only)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const pet = await db.Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });
    res.status(200).json({ pet });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update pet (owner only)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const pet = await db.Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });

    Object.assign(pet, req.body, { updatedAt: Date.now() });
    await pet.save();
    res.status(200).json({ message: "Pet updated", pet });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Delete pet (owner only)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const pet = await db.Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });

    await db.Pet.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Pet deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Add vaccination entry
router.post("/:id/vaccinations", requireAuth, async (req, res) => {
  try {
    const { vaccine, date, clinic, notes } = req.body;
    if (!vaccine || !date) return res.status(400).json({ message: "vaccine and date are required" });

    const pet = await db.Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });

    pet.vaccinations.push({ vaccine, date, clinic, notes });
    pet.updatedAt = Date.now();
    await pet.save();

    res.status(201).json({ message: "Vaccination added", pet });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Add medical log entry
router.post("/:id/medical-logs", requireAuth, async (req, res) => {
  try {
    const { date, type, title, description, attachments } = req.body;
    if (!date || !description) return res.status(400).json({ message: "date and description are required" });

    const pet = await db.Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });

    pet.medicalLogs.push({ date, type, title, description, attachments: Array.isArray(attachments) ? attachments : [] });
    pet.updatedAt = Date.now();
    await pet.save();

    res.status(201).json({ message: "Medical log added", pet });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

