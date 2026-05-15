const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const aiHistorySchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: [true, "User reference is required"] 
    },
    question: { 
        type: String, 
        required: [true, "Question is required"] 
    },
    answer: { 
        type: String, 
        required: [true, "Answer is required"] 
    },
    type: { 
        type: String, 
        enum: ["general", "medical", "diet", "behavior"],
        default: "general" 
    },
    metadata: {
        tokens: { type: Number },
        model: { type: String },
        duration: { type: Number }
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Index for faster history retrieval for a specific user
aiHistorySchema.index({ userId: 1, createdAt: -1 });

const AIHistory = mongoose.model("AIHistory", aiHistorySchema);

module.exports = AIHistory;
