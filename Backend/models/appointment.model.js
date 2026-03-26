const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  partner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  pet: { type: Schema.Types.ObjectId, ref: "Pet", required: true },
  service: { type: Schema.Types.ObjectId, ref: "Service", required: true },

  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },

  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending"
  },
  note: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;

