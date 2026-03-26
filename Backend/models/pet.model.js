const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vaccinationSchema = new Schema(
  {
    vaccine: { type: String, required: true },
    date: { type: Date, required: true },
    clinic: { type: String },
    notes: { type: String }
  },
  { _id: false }
);

const medicalLogSchema = new Schema(
  {
    date: { type: Date, required: true },
    type: { type: String, enum: ["visit", "treatment", "note", "allergy", "vaccination"], default: "note" },
    title: { type: String },
    description: { type: String, required: true },
    attachments: [{ type: String }]
  },
  { _id: false }
);

const petSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  species: { type: String, required: true }, // dog/cat/other
  breed: { type: String },
  gender: { type: String, enum: ["male", "female", "unknown"], default: "unknown" },
  dob: { type: Date },
  weightKg: { type: Number },
  photo: { type: String },

  allergies: [{ type: String }],
  vaccinations: [vaccinationSchema],
  medicalLogs: [medicalLogSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Pet = mongoose.model("Pet", petSchema);
module.exports = Pet;

