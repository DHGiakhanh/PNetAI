const express = require("express");
const db = require("../models");
const { requireAuth, requireAnyRole } = require("../middlewares/rbac");

const router = express.Router();

// ---- Leads (CRM pipeline) ----
router.get("/leads", requireAuth, requireAnyRole(["sale", "admin"]), async (req, res) => {
  try {
    const { stage } = req.query;
    const query = {};
    if (stage) query.stage = stage;
    if (req.role === "sale") query.createdBy = req.userId;

    const leads = await db.Lead.find(query).sort({ updatedAt: -1, createdAt: -1 });
    res.status(200).json({ leads });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/leads", requireAuth, requireAnyRole(["sale", "admin"]), async (req, res) => {
  try {
    const { businessName, contactName, contactEmail, contactPhone, partnerType, note } = req.body;
    if (!businessName || !partnerType) {
      return res.status(400).json({ message: "businessName and partnerType are required" });
    }

    const lead = new db.Lead({
      createdBy: req.userId,
      businessName,
      contactName,
      contactEmail,
      contactPhone,
      partnerType,
      stage: "new",
      notes: note ? [{ text: note }] : []
    });
    await lead.save();
    res.status(201).json({ message: "Lead created", lead });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/leads/:id", requireAuth, requireAnyRole(["sale", "admin"]), async (req, res) => {
  try {
    const lead = await db.Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    if (req.role === "sale" && lead.createdBy.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });

    const { stage, note } = req.body;
    if (stage) lead.stage = stage;
    if (note) lead.notes.push({ text: note });
    lead.updatedAt = Date.now();
    await lead.save();

    res.status(200).json({ message: "Lead updated", lead });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ---- Customer lookup by code ----
router.get("/customers/by-code/:code", requireAuth, requireAnyRole(["sale", "admin"]), async (req, res) => {
  try {
    const user = await db.User.findOne({ customerCode: req.params.code })
      .select("-password -verificationToken -resetPasswordToken -resetPasswordExpires")
      .populate("managedBy", "name email");
    if (!user) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ user });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ---- Support tickets ----
router.get("/tickets", requireAuth, requireAnyRole(["sale", "admin"]), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const tickets = await db.SupportTicket.find(query)
      .populate("createdBy", "name email customerCode role")
      .populate("assignedTo", "name email role")
      .sort({ updatedAt: -1 });
    res.status(200).json({ tickets });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/tickets/:id/assign", requireAuth, requireAnyRole(["sale", "admin"]), async (req, res) => {
  try {
    const ticket = await db.SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.assignedTo = req.userId;
    ticket.status = "in_progress";
    ticket.updatedAt = Date.now();
    await ticket.save();

    res.status(200).json({ message: "Ticket assigned", ticket });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/tickets/:id/reply", requireAuth, requireAnyRole(["sale", "admin"]), async (req, res) => {
  try {
    const { text, status } = req.body;
    if (!text) return res.status(400).json({ message: "text is required" });

    const ticket = await db.SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.messages.push({ user: req.userId, text });
    if (status) ticket.status = status;
    ticket.updatedAt = Date.now();
    await ticket.save();

    res.status(200).json({ message: "Replied", ticket });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

