const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const medicalHistoryRecordSchema = new Schema(
    {
        note: { type: String, required: true, trim: true },
        provider: { type: Schema.Types.ObjectId, ref: "User" },
        providerName: { type: String, default: "" },
        sourceBooking: { type: Schema.Types.ObjectId, ref: "ServiceBooking" },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const normalizeMedicalHistoryRecords = (records) => {
    if (!Array.isArray(records)) return [];

    return records
        .map((record) => {
            const note = typeof record?.note === "string" ? record.note.trim() : "";
            if (!note) return null;

            return {
                _id: record._id,
                note,
                provider: record.provider,
                providerName: record.providerName || "",
                sourceBooking: record.sourceBooking,
                createdAt: record.createdAt || new Date(),
            };
        })
        .filter(Boolean);
};

const petSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    species: { type: String, enum: ["Dog", "Cat", "Bird", "Rabbit", "Hamster", "Other"], default: "Other" },
    breed: { type: String, trim: true, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Unknown"], default: "Unknown" },
    age: { type: Number, min: 0, default: 0 },
    birthday: { type: Date },
    weightKg: { type: Number, min: 0, default: 0 },
    isSpayed: { type: Boolean, default: false },
    healthStatus: { type: String, default: "Healthy" },
    allergies: { type: String, default: "" },
    medicalHistory: { type: String, default: "" },
    medicalHistoryRecords: { type: [medicalHistoryRecordSchema], default: [] },
    lastVisitDate: { type: Date },
    avatarUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

petSchema.pre("validate", function (next) {
    this.medicalHistoryRecords = normalizeMedicalHistoryRecords(this.medicalHistoryRecords);
    next();
});

petSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;
