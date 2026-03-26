const express = require("express");
const db = require("../models");
const { requireAuth, requireAnyRole } = require("../middlewares/rbac");
const { upload } = require("../config/upload");

const router = express.Router();

// Submit partner application (owner/user account)
router.post("/apply", requireAuth, upload.array("licenses", 10), async (req, res) => {
  try {
    const licenseFiles = (req.files || []).map((f) => `/uploads/${f.filename}`);

    const payload = {
      user: req.userId,
      businessName: req.body.businessName,
      partnerType: req.body.partnerType,
      description: req.body.description,
      address: req.body.address,
      phone: req.body.phone,
      licenseFiles,
      status: "submitted",
      updatedAt: Date.now()
    };

    if (!payload.businessName || !payload.partnerType) {
      return res.status(400).json({ message: "businessName and partnerType are required" });
    }

    const existing = await db.PartnerApplication.findOne({ user: req.userId });
    if (existing) {
      existing.businessName = payload.businessName;
      existing.partnerType = payload.partnerType;
      existing.description = payload.description;
      existing.address = payload.address;
      existing.phone = payload.phone;
      existing.licenseFiles = existing.licenseFiles.concat(licenseFiles);
      existing.status = "submitted";
      existing.updatedAt = Date.now();
      await existing.save();
      return res.status(200).json({ message: "Application updated", application: existing });
    }

    const app = new db.PartnerApplication(payload);
    await app.save();
    res.status(201).json({ message: "Application submitted", application: app });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get my application
router.get("/me", requireAuth, async (req, res) => {
  try {
    const application = await db.PartnerApplication.findOne({ user: req.userId });
    res.status(200).json({ application });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// List applications (sale/admin)
router.get("/", requireAuth, requireAnyRole(["admin", "sale"]), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const applications = await db.PartnerApplication.find(query)
      .populate("user", "name email role")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Approve/reject application (sale/admin)
router.post("/:id/review", requireAuth, requireAnyRole(["admin", "sale"]), async (req, res) => {
  try {
    const { decision, note } = req.body; // approved | rejected
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approved or rejected" });
    }

    const application = await db.PartnerApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    application.status = decision;
    application.reviewNote = note;
    application.reviewedBy = req.userId;
    application.reviewedAt = new Date();
    application.updatedAt = Date.now();
    await application.save();

    if (decision === "approved") {
      await db.User.findByIdAndUpdate(application.user, {
        role: "partner",
        isVerified: true,
        partnerType: application.partnerType
      });
    }

    res.status(200).json({ message: "Reviewed", application });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

