const express = require("express");
const db = require("../models");
const { requireAuth, requireAnyRole } = require("../middlewares/rbac");

const router = express.Router();

// Public: list active services
router.get("/", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const services = await db.Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("partner", "name email partnerType");

    const total = await db.Service.countDocuments(query);

    res.status(200).json({
      services,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Public: services by partner
router.get("/partner/:partnerId", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const services = await db.Service.find({ partner: partnerId, isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ services });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Public: service detail
router.get("/:id", async (req, res) => {
  try {
    const service = await db.Service.findById(req.params.id).populate("partner", "name email partnerType");
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (!service.isActive) return res.status(404).json({ message: "Service not found" });
    res.status(200).json({ service });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

function authorizePartnerService(req, serviceDoc) {
  if (!serviceDoc) return false;
  if (req.role === "admin") return true;
  if (req.role === "partner" && serviceDoc.partner.toString() === req.userId) return true;
  return false;
}

// Partner/admin create service
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.role !== "partner" && req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const partnerId = req.role === "partner" ? req.userId : req.body.partner;
    if (!partnerId) return res.status(400).json({ message: "partner is required" });

    if (req.role === "partner" && partnerId !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, description, category, price, durationMinutes, isActive } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: "name and price are required" });

    const service = new db.Service({
      partner: partnerId,
      name,
      description,
      category,
      price,
      durationMinutes,
      isActive: isActive !== undefined ? isActive : true
    });

    await service.save();
    res.status(201).json({ message: "Service created", service });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update service
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const service = await db.Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (!authorizePartnerService(req, service)) return res.status(403).json({ message: "Access denied" });

    Object.assign(service, req.body, { updatedAt: Date.now() });
    await service.save();
    res.status(200).json({ message: "Service updated", service });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Delete service (soft: deactivate)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const service = await db.Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (!authorizePartnerService(req, service)) return res.status(403).json({ message: "Access denied" });

    service.isActive = false;
    service.updatedAt = Date.now();
    await service.save();
    res.status(200).json({ message: "Service deactivated" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

