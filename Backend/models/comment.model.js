const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

commentSchema.index({ post: 1, user: 1 });

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;

