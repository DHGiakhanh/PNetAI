const mongoose = require("mongoose");
const db = require("../models");
require("dotenv").config();

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected for auto-tagging");
    } catch (error) {
        console.error("Connection error:", error);
        process.exit(1);
    }
};

const tagData = async () => {
    const products = await db.Product.find();
    const services = await db.Service.find();

    const rules = [
        { keywords: ["mèo", "cat"], tag: "cat" },
        { keywords: ["chó", "dog", "cún"], tag: "dog" },
        { keywords: ["chim", "bird"], tag: "bird" },
        { keywords: ["thỏ", "rabbit", "timothy"], tag: "rabbit" },
        { keywords: ["hamster"], tag: "hamster" },
        { keywords: ["vắc xin", "tiêm", "vaccine", "bác sĩ", "khám"], tag: "medical" },
        { keywords: ["tắm", "tỉa", "grooming", "spa"], tag: "grooming" }
    ];

    const processItem = async (item, type) => {
        let tags = new Set(item.tags || []);
        const name = (item.name || item.title || "").toLowerCase();
        const description = (item.description || "").toLowerCase();
        const category = (item.category || "").toLowerCase();
        
        const combinedText = `${name} ${description} ${category}`;
        
        rules.forEach(rule => {
            if (rule.keywords.some(k => combinedText.includes(k))) {
                tags.add(rule.tag);
            }
        });

        // Fallback logic: Ensure every item has at least one tag
        if (tags.size === 0) {
            // Add species tag based on commonality
            tags.add("dog");
            tags.add("cat");

            // Add functional tag based on category
            if (type === 'product') {
                if (category.includes("toy")) tags.add("toys");
                else if (category.includes("food")) tags.add("food");
                else tags.add("accessories");
            } else {
                if (category.includes("medical") || category.includes("clinic")) tags.add("medical");
                else if (category.includes("spa") || category.includes("grooming")) tags.add("grooming");
                else tags.add("travel");
            }
        }

        // Always ensure tags field exists as an array
        item.tags = Array.from(tags);
        await item.save();
        return true;
    };

    console.log("Processing Products...");
    let pCount = 0;
    for (const p of products) {
        if (await processItem(p, 'product')) pCount++;
    }
    console.log(`Processed ${pCount} products.`);

    console.log("Processing Services...");
    let sCount = 0;
    for (const s of services) {
        if (await processItem(s, 'service')) sCount++;
    }
    console.log(`Processed ${sCount} services.`);

    console.log("Auto-tagging completed!");
    process.exit(0);
};

connectDb().then(tagData);
