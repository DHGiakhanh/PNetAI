const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const systemSettingSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
  category: { 
    type: String, 
    enum: ["commission", "security", "payment", "notification", "general"],
    required: true 
  },
  type: {
    type: String,
    enum: ["string", "number", "boolean", "object", "array"],
    required: true
  },
  isPublic: { type: Boolean, default: false }, // Whether this setting can be accessed by non-admin users
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

systemSettingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);
module.exports = SystemSetting;
