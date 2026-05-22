const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const breedingRequestSchema = new Schema({
    listing: { type: Schema.Types.ObjectId, ref: "BreedingListing", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requesterPet: { type: Schema.Types.ObjectId, ref: "Pet", required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

breedingRequestSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const BreedingRequest = mongoose.model("BreedingRequest", breedingRequestSchema);
module.exports = BreedingRequest;
