const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { createPaymentLink } = require("../utils/payos");

const router = express.Router();

const generateOrderCode = () => {
    const random = Math.floor(Math.random() * 900) + 100;
    return Number(`${Date.now()}${random}`);
};

const generateUniqueOrderCode = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const orderCode = generateOrderCode();
        const existingTx = await db.Transaction.exists({ payosOrderCode: String(orderCode) });
        if (!existingTx) {
            return orderCode;
        }
    }
    throw new Error("Cannot generate unique PayOS orderCode");
};

const ensureValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

// Create a new service booking (Manual/Test)
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
            paymentMethod: paymentMethod || "Manual",
            status: "pending"
        });

        await newBooking.save();

        // Notify provider about the new request
        if (service.providerId && service.providerId.email) {
            const { sendNewBookingNotificationToProvider } = require("../config/emailService");
            const dateStr = new Date(bookingDate).toLocaleDateString();
            await sendNewBookingNotificationToProvider(service.providerId.email, {
                serviceTitle: service.title,
                customerName: user.name || "Customer",
                petName: pet.name,
                date: dateStr,
                time: bookingTime,
                totalAmount
            });
        }

        res.status(201).json({
            message: "Booking request received and is pending provider approval.",
            booking: newBooking
        });
    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ message: "An error occurred during booking." });
    }
});

// Create booking with PayOS payment
router.post("/confirm/payos", verifyToken, async (req, res) => {
    try {
        const { serviceId, petId, bookingDate, bookingTime, totalAmount, note, returnUrl, cancelUrl } = req.body;

        if (!serviceId || !petId || !bookingDate || !bookingTime || !totalAmount) {
            return res.status(400).json({ message: "Missing required booking details." });
        }

        const service = await db.Service.findById(serviceId).populate('providerId', 'name email');
        if (!service) return res.status(404).json({ message: "Service not found." });

        const pet = await db.Pet.findById(petId);
        if (!pet) return res.status(404).json({ message: "Pet profile not found." });

        const user = await db.User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const finalReturnUrl = returnUrl || `${frontendUrl}/services/${serviceId}/booking/success`;
        const finalCancelUrl = cancelUrl || `${frontendUrl}/services/${serviceId}/booking/cancel`;

        if (!ensureValidUrl(finalReturnUrl) || !ensureValidUrl(finalCancelUrl)) {
            return res.status(400).json({ message: "Invalid returnUrl or cancelUrl" });
        }

        const amount = Math.round(totalAmount);
        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid booking amount for PayOS" });
        }

        // Create booking in pending state
        const newBooking = new db.Booking({
            user: req.userId,
            service: serviceId,
            pet: petId,
            bookingDate: new Date(bookingDate),
            bookingTime,
            totalAmount: amount,
            paymentMethod: "PayOS",
            status: "pending"
        });
        await newBooking.save();

        // Create PayOS payment link
        const orderCode = await generateUniqueOrderCode();
        const payload = {
            orderCode,
            amount,
            description: `BK ${orderCode}`.slice(0, 25),
            cancelUrl: finalCancelUrl,
            returnUrl: finalReturnUrl,
            items: [
                {
                    name: service.title.slice(0, 100),
                    quantity: 1,
                    price: amount,
                }
            ],
            buyerName: user.name || "Customer",
            buyerPhone: user.phone || "0000000000",
            buyerAddress: user.address || "Vietnam",
        };

        const payOSResponse = await createPaymentLink(payload);
        if (payOSResponse?.code !== "00" || !payOSResponse?.data) {
            // Cleanup booking if PayOS fails
            await db.Booking.findByIdAndDelete(newBooking._id);
            return res.status(502).json({
                message: "Cannot create payment link from PayOS",
                payos: payOSResponse,
            });
        }

        // Create transaction record
        const transaction = new db.Transaction({
            user: req.userId,
            type: "service_booking",
            provider: service.providerId._id || service.providerId,
            amount: amount,
            status: "pending",
            paymentMethod: "PayOS",
            payosOrderCode: String(orderCode),
            referenceId: newBooking._id,
            note: note || "",
        });
        await transaction.save();

        res.status(201).json({
            message: "PayOS payment link created for booking",
            booking: newBooking,
            payment: {
                orderCode,
                paymentLinkId: payOSResponse.data.paymentLinkId,
                checkoutUrl: payOSResponse.data.checkoutUrl,
                qrCode: payOSResponse.data.qrCode,
                status: payOSResponse.data.status,
            },
        });
    } catch (error) {
        console.error("Booking PayOS Error:", error);
        res.status(500).json({
            message: "Cannot create PayOS payment link for booking",
            error: error.response?.data || error.message,
        });
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
        const rawBookings = await db.Booking.find({ user: req.userId })
            .populate('service', 'title description images duration location')
            .populate('pet', 'name avatarUrl species breed')
            .sort({ bookingDate: -1 });

        // Filter out bookings where service or pet might have been deleted
        const bookings = rawBookings.filter(b => b.service && b.pet);

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bookings for services owned by current provider
router.get("/provider", verifyToken, async (req, res) => {
    try {
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

// Update booking status
router.patch("/status/:id", verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const booking = await db.Booking.findById(req.params.id)
            .populate('user', 'email name')
            .populate('pet', 'name')
            .populate({
                path: 'service',
                select: 'title providerId',
                populate: {
                    path: 'providerId',
                    select: 'name'
                }
            });

        if (!booking) return res.status(404).json({ message: "Booking not found." });

        const service = booking.service;
        const provider = service.providerId;

        if (provider._id.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied." });
        }

        const oldStatus = booking.status;
        booking.status = status;
        booking.updatedAt = Date.now();
        await booking.save();

        const { 
            sendBookingConfirmationEmail, 
            sendBookingCancellationEmailToUser, 
            sendRefundRequestToAdmin 
        } = require("../config/emailService");

        // Send email to USER if confirmed
        if (status === "confirmed" && oldStatus !== "confirmed") {
            await sendBookingConfirmationEmail(booking.user.email, {
                serviceTitle: service.title,
                petName: booking.pet.name,
                date: booking.bookingDate.toLocaleDateString(),
                time: booking.bookingTime,
                totalAmount: booking.totalAmount
            });
        }

        // Send email to USER & ADMIN if cancelled by Provider
        if (status === "cancelled" && oldStatus !== "cancelled") {
            await sendBookingCancellationEmailToUser(booking.user.email, {
                serviceTitle: service.title,
                date: booking.bookingDate.toLocaleDateString(),
                time: booking.bookingTime
            });

            await sendRefundRequestToAdmin({
                bookingId: booking._id,
                customerName: booking.user.name,
                totalAmount: booking.totalAmount,
                providerName: provider.name
            });

            // 3. Create In-App Notification for Admin
            await db.Notification.create({
                title: "Refund Required",
                message: `Booking #${booking._id.toString().slice(-8).toUpperCase()} was cancelled by provider ${provider.name}. Please refund ${booking.totalAmount} VND to ${booking.user.name}.`,
                type: "refund_request",
                relatedId: booking._id,
                isAdmin: true
            });
        }

        res.status(200).json({ message: `Booking ${status}`, booking });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
