const express = require("express");
const db = require("../models");
const { requireAuth } = require("../middlewares/rbac");

const router = express.Router();

// Owner/Partner: create ticket
router.post("/tickets", requireAuth, async (req, res) => {
  try {
    const { subject, description } = req.body;
    if (!subject || !description) return res.status(400).json({ message: "subject and description are required" });

    const me = await db.User.findById(req.userId).select("customerCode");
    const ticket = await db.SupportTicket.create({
      createdBy: req.userId,
      customerCode: me?.customerCode,
      subject,
      description,
      status: "open",
      messages: [{ user: req.userId, text: description }]
    });

    res.status(201).json({ message: "Ticket created", ticket });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Owner/Partner: list my tickets
router.get("/tickets/me", requireAuth, async (req, res) => {
  try {
    const tickets = await db.SupportTicket.find({ createdBy: req.userId })
      .populate("assignedTo", "name email role")
      .sort({ updatedAt: -1 });
    res.status(200).json({ tickets });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

