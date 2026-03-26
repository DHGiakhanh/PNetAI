const express = require("express");

const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
    res.status(200).json({ message: "Test route works!" });
});

// Simple test post
router.post('/test', (req, res) => {
    res.status(200).json({ message: "Test POST works!", body: req.body });
});

module.exports = router;
