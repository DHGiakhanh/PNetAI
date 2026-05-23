const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
