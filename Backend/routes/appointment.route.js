const express = require("express");
const db = require("../models");
const { requireAuth, requireAnyRole } = require("../middlewares/rbac");

const router = express.Router();

function isWithinEhrAccessWindow(appointment, now = new Date()) {
  // Window: 30 minutes before start -> 2 hours after end
  const startWindow = new Date(appointment.startTime).getTime() - 30 * 60 * 1000;
  const endWindow = new Date(appointment.endTime).getTime() + 2 * 60 * 60 * 1000;
  const t = now.getTime();
  return t >= startWindow && t <= endWindow;
}

function canTransitionStatus(current, next) {
  const allowed = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: []
  };
  return (allowed[current] || []).includes(next);
}

// Owner: book appointment
router.post("/book", requireAuth, async (req, res) => {
  try {
    const { serviceId, petId, scheduledAt, note } = req.body;
    if (!serviceId || !petId || !scheduledAt) {
      return res.status(400).json({ message: "serviceId, petId, scheduledAt are required" });
    }

    const service = await db.Service.findById(serviceId);
    if (!service || !service.isActive) return res.status(404).json({ message: "Service not found" });

    const pet = await db.Pet.findById(petId);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });

    const partnerId = service.partner.toString();

    const startTime = new Date(scheduledAt);
    if (Number.isNaN(startTime.getTime())) return res.status(400).json({ message: "scheduledAt is invalid" });

    const durationMs = (service.durationMinutes || 30) * 60 * 1000;
    const endTime = new Date(startTime.getTime() + durationMs);

    // Check conflicts for the partner (overlap intervals)
    const conflict = await db.Appointment.findOne({
      partner: partnerId,
      status: { $in: ["pending", "confirmed"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });
    if (conflict) {
      return res.status(400).json({ message: "Time slot is not available" });
    }

    const appointment = new db.Appointment({
      owner: req.userId,
      partner: partnerId,
      pet: petId,
      service: serviceId,
      startTime,
      endTime,
      status: "pending",
      note
    });

    await appointment.save();
    res.status(201).json({ message: "Appointment created (pending)", appointment });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Owner: my appointments
router.get("/me", requireAuth, async (req, res) => {
  try {
    const appointments = await db.Appointment.find({ owner: req.userId })
      .populate("partner", "name email partnerType")
      .populate("pet", "name species breed")
      .populate("service", "name price durationMinutes category")
      .sort({ startTime: -1 });

    res.status(200).json({ appointments });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Partner/admin: appointments for my/any business
router.get("/partner/me", requireAuth, async (req, res) => {
  try {
    if (req.role !== "partner" && req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const filter = req.role === "partner" ? { partner: req.userId } : {};
    const appointments = await db.Appointment.find(filter)
      .populate("owner", "name email")
      .populate("pet", "name species breed")
      .populate("service", "name price durationMinutes category")
      .sort({ startTime: -1 });

    res.status(200).json({ appointments });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get appointment by id (owner/partner/admin)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const appointment = await db.Appointment.findById(req.params.id)
      .populate("owner", "name email role")
      .populate("partner", "name email role partnerType")
      .populate("pet", "name species breed allergies vaccinations")
      .populate("service", "name price durationMinutes category");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const isOwner = appointment.owner.toString() === req.userId;
    const isPartner = appointment.partner.toString() === req.userId;
    if (req.role !== "admin" && !isOwner && !isPartner) return res.status(403).json({ message: "Access denied" });

    res.status(200).json({ appointment });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Owner: cancel appointment
router.put("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const appointment = await db.Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.owner.toString() !== req.userId) return res.status(403).json({ message: "Access denied" });
    if (!["pending", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({ message: "Cannot cancel this appointment" });
    }
    appointment.status = "cancelled";
    appointment.updatedAt = Date.now();
    await appointment.save();
    res.status(200).json({ message: "Appointment cancelled", appointment });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Partner/admin: update status
router.put("/:id/status", requireAuth, requireAnyRole(["partner", "admin"]), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await db.Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (req.role === "partner" && appointment.partner.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Enforce transition rules to keep lifecycle consistent.
    if (!canTransitionStatus(appointment.status, status)) {
      return res.status(400).json({ message: `Cannot transition from ${appointment.status} to ${status}` });
    }

    appointment.status = status;
    appointment.updatedAt = Date.now();
    await appointment.save();
    res.status(200).json({ message: "Appointment updated", appointment });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Partner time-limited EHR access
router.get("/:id/pet-records", requireAuth, async (req, res) => {
  try {
    const appointment = await db.Appointment.findById(req.params.id).populate("pet");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (req.role === "admin") {
      return res.status(200).json({ pet: appointment.pet, appointment });
    }

    if (appointment.status === "cancelled") {
      return res.status(403).json({ message: "EHR access not available for cancelled appointments" });
    }

    const isOwner = appointment.owner.toString() === req.userId;
    const isPartner = appointment.partner.toString() === req.userId;

    if (isOwner) {
      return res.status(200).json({ pet: appointment.pet, appointment });
    }

    if (isPartner) {
      if (!isWithinEhrAccessWindow(appointment)) {
        return res.status(403).json({ message: "EHR access is outside allowed time window" });
      }
      return res.status(200).json({ pet: appointment.pet, appointment });
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

