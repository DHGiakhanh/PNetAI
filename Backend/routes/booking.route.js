const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { sendBookingConfirmationEmail } = require("../config/emailService");

const router = express.Router();

// Create a new service booking
router.post("/confirm", verifyToken, async (req, res) => {
    try {
        const { serviceId, petId, bookingDate, bookingTime, totalAmount, paymentMethod } = req.body;

        if (!serviceId || !petId || !bookingDate || !bookingTime || !totalAmount) {
            return res.status(400).json({ message: "Missing required booking details." });
        }

        const service = await db.Service.findById(serviceId).populate('providerId', 'name email');
        if (!service) return res.status(404).json({ message: "Service not found." });

        const pet = await db.Pet.findById(petId);
        if (!pet) return res.status(404).json({ message: "Pet profile not found." });

        const user = await db.User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const newBooking = new db.Booking({
            user: req.userId,
            service: serviceId,
            pet: petId,
            bookingDate: new Date(bookingDate),
            bookingTime,
            totalAmount,
            paymentMethod: paymentMethod || "PayOS",
            status: "confirmed" // Auto-confirm for this demo/flow
        });

        await newBooking.save();

        // Send automated confirmation email
        const dateStr = new Date(bookingDate).toLocaleDateString();
        await sendBookingConfirmationEmail(user.email, {
            serviceTitle: service.title,
            petName: pet.name,
            date: dateStr,
            time: bookingTime,
            totalAmount
        });

        res.status(201).json({
            message: "Booking confirmed successfully. A confirmation email has been sent.",
            booking: newBooking
        });
    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ message: "An error occurred during booking." });
    }
});

// Get occupied slots for a service in a specific month
router.get("/service-availability/:serviceId", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { month, year } = req.query; // 0-indexed month

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required." });
        }

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, Number(month) + 1, 1);

        const bookings = await db.Booking.find({
            service: serviceId,
            bookingDate: {
                $gte: startDate,
                $lt: endDate
            },
            status: { $ne: 'cancelled' }
        }).select('bookingDate bookingTime status');

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's bookings
router.get("/my", verifyToken, async (req, res) => {
    try {
        const bookings = await db.Booking.find({ user: req.userId })
            .populate('service', 'title description images duration location')
            .populate('pet', 'name avatarUrl species breed')
            .sort({ bookingDate: -1 });

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bookings for services owned by current provider
router.get("/provider", verifyToken, async (req, res) => {
    try {
        // Find all services owned by this provider
        const myServices = await db.Service.find({ providerId: req.userId }).select('_id');
        const serviceIds = myServices.map(s => s._id);

        const bookings = await db.Booking.find({ service: { $in: serviceIds } })
            .populate('service', 'title')
            .populate('user', 'name email phone')
            .populate('pet', 'name avatarUrl species breed')
            .sort({ bookingDate: -1 });

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
