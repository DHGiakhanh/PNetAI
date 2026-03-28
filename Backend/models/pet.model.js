const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const petSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    species: { type: String, enum: ["Dog", "Cat", "Other"], default: "Other" },
    breed: { type: String, trim: true, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Unknown"], default: "Unknown" },
    age: { type: Number, min: 0, default: 0 },
    weightKg: { type: Number, min: 0, default: 0 },
    healthStatus: { type: String, default: "Healthy" },
    lastVisitDate: { type: Date },
    avatarUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

petSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;
