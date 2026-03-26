const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const followSchema = new Schema({
  follower: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  followee: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

followSchema.index({ follower: 1, followee: 1 }, { unique: true });

const Follow = mongoose.model("Follow", followSchema);
module.exports = Follow;

