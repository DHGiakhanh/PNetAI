const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supportTicketSchema = new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }, // owner/partner
  customerCode: { type: String, index: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" }, // sale/admin
  messages: [
    {
      at: { type: Date, default: Date.now },
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
module.exports = SupportTicket;

