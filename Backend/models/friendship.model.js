const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendshipSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true, // Auto handles createdAt and updatedAt
  }
);

// Compound index to guarantee uniqueness of relation between two users
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ status: 1 });

const Friendship = mongoose.model("Friendship", friendshipSchema);

module.exports = Friendship;
