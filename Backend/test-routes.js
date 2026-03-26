const express = require("express");

// Test loading each route individually
async function testRoutes() {
    console.log("Testing route loading...");
    
    try {
        console.log("1. Testing auth.route.js");
        const authRoutes = require("./routes/auth.route");
        console.log("✓ auth.route.js loaded successfully");
    } catch (e) {
        console.error("✗ auth.route.js failed:", e.message);
        return;
    }
    
    try {
        console.log("2. Testing dashboard.route.js");
        const dashboardRoutes = require("./routes/dashboard.route");
        console.log("✓ dashboard.route.js loaded successfully");
    } catch (e) {
        console.error("✗ dashboard.route.js failed:", e.message);
        return;
    }
    
    try {
        console.log("3. Testing api.route.js");
        const ApiRouter = require("./routes/api.route");
        console.log("✓ api.route.js loaded successfully");
    } catch (e) {
        console.error("✗ api.route.js failed:", e.message);
        return;
    }
    
    try {
        console.log("4. Testing models");
        const db = require("./models");
        console.log("✓ models loaded successfully");
    } catch (e) {
        console.error("✗ models failed:", e.message);
        return;
    }
    
    console.log("All routes loaded successfully!");
}

testRoutes();
