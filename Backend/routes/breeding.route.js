const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Retrieve approved breeding listings. Filter by pet species, breed, and gender.
router.get('/', async (req, res) => {
    try {
        const { species, breed, gender } = req.query;
        let filter = { status: "approved" };

        let petQuery = {};
        if (species) petQuery.species = species;
        if (breed) petQuery.breed = { $regex: breed, $options: 'i' };
        if (gender) petQuery.gender = gender;

        // If we have filters on pet, find matching pet IDs
        if (species || breed || gender) {
            const matchedPets = await db.Pet.find(petQuery).select('_id');
            const petIds = matchedPets.map(p => p._id);
            filter.pet = { $in: petIds };
        }

        const listings = await db.BreedingListing.find(filter)
            .populate('pet')
            .populate('user', 'name avatarUrl email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ listings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Retrieve current user's listings
router.get('/my-listings', verifyToken, async (req, res) => {
    try {
        const listings = await db.BreedingListing.find({ user: req.userId })
            .populate('pet')
            .sort({ createdAt: -1 });
        res.status(200).json({ listings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create breeding listing for one of the user's pets
router.post('/', verifyToken, async (req, res) => {
    try {
        const { petId, title, description, images } = req.body;
        if (!petId || !title || !description) {
            return res.status(400).json({ message: "Pet ID, title, and description are required" });
        }

        // Check if pet belongs to user
        const pet = await db.Pet.findById(petId);
        if (!pet) return res.status(404).json({ message: "Pet not found" });
        if (pet.user.toString() !== req.userId) {
            return res.status(403).json({ message: "This pet does not belong to you" });
        }

        // Check if listing already exists for this pet and is pending/approved
        const existing = await db.BreedingListing.findOne({
            pet: petId,
            status: { $in: ["pending", "approved"] }
        });
        if (existing) {
            return res.status(400).json({ message: "A breeding listing for this pet already exists." });
        }

        const listing = new db.BreedingListing({
            pet: petId,
            user: req.userId,
            title,
            description,
            images: images || [],
            status: "pending"
        });

        await listing.save();
        res.status(201).json({ message: "Breeding listing submitted for approval", listing });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Hide (disable) a listing — owner only. Used after a successful match.
router.patch('/:id/hide', verifyToken, async (req, res) => {
    try {
        const listing = await db.BreedingListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        if (listing.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied. Not the listing owner." });
        }

        listing.status = "disabled";
        await listing.save();

        res.status(200).json({ message: "Breeding listing hidden successfully", listing });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a listing (owner/admin only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const listing = await db.BreedingListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        if (req.role !== 'admin' && listing.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied. Not the listing owner." });
        }

        await db.BreedingListing.findByIdAndDelete(req.params.id);
        // Delete requests associated with this listing
        await db.BreedingRequest.deleteMany({ listing: req.params.id });

        res.status(200).json({ message: "Breeding listing deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit request to breed
router.post('/:id/request', verifyToken, async (req, res) => {
    try {
        const { requesterPetId, message } = req.body;
        if (!requesterPetId || !message) {
            return res.status(400).json({ message: "Requester pet and message are required" });
        }

        const listing = await db.BreedingListing.findById(req.params.id).populate('pet');
        if (!listing) return res.status(404).json({ message: "Breeding listing not found" });

        if (listing.status !== "approved") {
            return res.status(400).json({ message: "This listing is not currently active for breeding" });
        }

        if (listing.user.toString() === req.userId) {
            return res.status(400).json({ message: "You cannot request breeding with your own pet listing" });
        }

        const requesterPet = await db.Pet.findById(requesterPetId);
        if (!requesterPet) return res.status(404).json({ message: "Your pet was not found" });

        if (requesterPet.user.toString() !== req.userId) {
            return res.status(403).json({ message: "This pet does not belong to you" });
        }

        // Compatibility validation
        if (listing.pet.species !== requesterPet.species) {
            return res.status(400).json({
                message: `Species mismatch. Listing pet is a ${listing.pet.species}, but your pet is a ${requesterPet.species}.`
            });
        }

        if (listing.pet.gender === "Unknown" || requesterPet.gender === "Unknown") {
            return res.status(400).json({
                message: "Both pets must have a known gender (Male or Female) for breeding."
            });
        }

        if (listing.pet.gender === requesterPet.gender) {
            return res.status(400).json({
                message: `Gender mismatch. Both pets are ${listing.pet.gender}. Breeding requires opposite genders.`
            });
        }

        // Check for existing request for this listing by same requester and requesterPet
        const existingRequest = await db.BreedingRequest.findOne({
            listing: listing._id,
            requester: req.userId,
            requesterPet: requesterPetId,
            status: "pending"
        });
        if (existingRequest) {
            return res.status(400).json({ message: "You have already sent a pending request for this listing with this pet." });
        }

        const breedingRequest = new db.BreedingRequest({
            listing: listing._id,
            requester: req.userId,
            requesterPet: requesterPetId,
            message
        });

        await breedingRequest.save();

        // Create notification for the listing owner
        const senderUser = await db.User.findById(req.userId);
        const senderName = senderUser ? senderUser.name : "Someone";
        await db.Notification.create({
            user: listing.user,
            title: "New Breeding Request received",
            message: `${senderName} wants to breed their pet "${requesterPet.name}" with your pet "${listing.pet.name}".`,
            type: "breeding_request",
            relatedId: breedingRequest._id
        });

        res.status(201).json({ message: "Breeding request sent successfully", breedingRequest });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Retrieve incoming breeding requests
router.get('/requests/incoming', verifyToken, async (req, res) => {
    try {
        const listings = await db.BreedingListing.find({ user: req.userId }).select('_id');
        const listingIds = listings.map(l => l._id);

        const requests = await db.BreedingRequest.find({ listing: { $in: listingIds } })
            .populate({
                path: 'listing',
                populate: { path: 'pet' }
            })
            .populate('requester', 'name avatarUrl email phone')
            .populate('requesterPet')
            .sort({ createdAt: -1 });

        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Retrieve outgoing breeding requests
router.get('/requests/outgoing', verifyToken, async (req, res) => {
    try {
        const requests = await db.BreedingRequest.find({ requester: req.userId })
            .populate({
                path: 'listing',
                populate: [{ path: 'pet' }, { path: 'user', select: 'name avatarUrl email phone' }]
            })
            .populate('requesterPet')
            .sort({ createdAt: -1 });

        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Accept or reject request
router.patch('/requests/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const request = await db.BreedingRequest.findById(req.params.id)
            .populate({
                path: 'listing',
                populate: { path: 'pet' }
            })
            .populate('requesterPet');

        if (!request) return res.status(404).json({ message: "Breeding request not found" });

        if (request.listing.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied. You are not the listing owner." });
        }

        request.status = status;
        await request.save();

        const ownerUser = await db.User.findById(req.userId);
        const ownerName = ownerUser ? ownerUser.name : "Someone";
        await db.Notification.create({
            user: request.requester,
            title: `Breeding Request ${status === "accepted" ? "Accepted" : "Rejected"}`,
            message: `${ownerName} has ${status} your breeding request for pet "${request.requesterPet.name}" with "${request.listing.pet.name}".`,
            type: "breeding_response",
            relatedId: request._id
        });

        res.status(200).json({ message: `Request status updated to ${status}`, request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
