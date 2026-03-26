const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const partnerApplicationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  businessName: { type: String, required: true },
  partnerType: { type: String, enum: ["vet", "spa", "shop"], required: true },
  description: { type: String },
  address: { type: String },
  phone: { type: String },
  licenseFiles: [{ type: String }], // saved file paths under /uploads
  status: { type: String, enum: ["draft", "submitted", "approved", "rejected"], default: "submitted" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  reviewNote: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PartnerApplication = mongoose.model("PartnerApplication", partnerApplicationSchema);
module.exports = PartnerApplication;

