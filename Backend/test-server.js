const express = require("express");
require("dotenv").config();

const app = express();

// Basic middleware
app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
    res.json({ message: "Test server works!" });
});

// Test auth route
app.post("/api/auth/register", (req, res) => {
    console.log("Request body:", req.body);
    res.json({ message: "Register test works!", body: req.body });
});

const PORT = process.env.PORT || 9999;

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
