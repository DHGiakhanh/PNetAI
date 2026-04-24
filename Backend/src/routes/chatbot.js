

const express = require('express');
const router = express.Router();

const CHATBOT_URL = process.env.CHATBOT_URL || 'http://localhost:8000';

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const response = await fetch(`${CHATBOT_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) throw new Error('Chatbot service error');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Chatbot service unavailable' });
    }
});

module.exports = router;