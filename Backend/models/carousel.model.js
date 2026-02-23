const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const carouselSchema = new Schema({
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Carousel = mongoose.model("Carousel", carouselSchema);

module.exports = Carousel;
