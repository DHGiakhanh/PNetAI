const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leadSchema = new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, // sale
  businessName: { type: String, required: true },
  contactName: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  partnerType: { type: String, enum: ["vet", "spa", "shop"], required: true },
  stage: {
    type: String,
    enum: ["new", "contacted", "training", "submitted", "approved", "rejected"],
    default: "new"
  },
  notes: [{ at: { type: Date, default: Date.now }, text: { type: String, required: true } }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model("Lead", leadSchema);
module.exports = Lead;

