const express = require("express");

const router = express.Router();

const CHATBOT_URL = (process.env.CHATBOT_URL || "http://localhost:8000").replace(/\/+$/, "");

router.post("/chat", async (req, res) => {
    try {
        const { message } = req.body || {};

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const upstreamResponse = await fetch(`${CHATBOT_URL}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream, application/json"
            },
            body: JSON.stringify(req.body),
        });

        if (!upstreamResponse.ok) {
            const errorText = await upstreamResponse.text();
            return res.status(upstreamResponse.status).json({
                error: "Internal LLM connection failed",
                details: errorText || "Upstream chatbot service returned an error."
            });
        }

        const contentType = upstreamResponse.headers.get("content-type") || "";

        if (contentType.includes("text/event-stream")) {
            if (!upstreamResponse.body) {
                return res.status(502).json({ error: "Chatbot stream unavailable" });
            }

            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");

            const reader = upstreamResponse.body.getReader();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                res.write(Buffer.from(value));
            }

            return res.end();
        }

        const data = await upstreamResponse.json();
        return res.json(data);
    } catch (error) {
        console.error("Chatbot proxy error:", error);
        return res.status(500).json({
            error: "Internal LLM connection failed",
            details: error.message
        });
    }
});

module.exports = router;
