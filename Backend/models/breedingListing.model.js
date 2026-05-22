const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const breedingListingSchema = new Schema({
    pet: { type: Schema.Types.ObjectId, ref: "Pet", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    status: { type: String, enum: ["pending", "approved", "disabled", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

breedingListingSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const BreedingListing = mongoose.model("BreedingListing", breedingListingSchema);
module.exports = BreedingListing;
