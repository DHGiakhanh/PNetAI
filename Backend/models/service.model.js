const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // "Grooming", "Veterinary", "Training", etc.
    basePrice: { type: Number, required: true },
    duration: { type: Number, required: true }, // Duration in minutes
    images: [{ type: String }],
    features: [{ type: String }], // List of features included
    isPopular: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    providerId: { type: Schema.Types.ObjectId, ref: 'User' }, // Service provider
    location: {
        address: { type: String },
        city: { type: String },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    availability: {
        days: [{ type: String }], // ["Monday", "Tuesday", etc.]
        hours: {
            start: { type: String }, // "09:00"
            end: { type: String }    // "17:00"
        }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;