const express = require('express');
const router = express.Router();
const db = require('../models');
const verifyToken = require('../middlewares/verifyToken');
const { GoogleGenAI } = require("@google/genai");

const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';

// Helper function to build the data context
async function getRealtimeContext(userId) {
    const pets = await db.Pet.find({ user: userId }).select('name breed species age weightKg healthStatus avatarUrl');
    const ateliersRaw = await db.User.find({ role: 'service_provider', status: 'active' }).limit(5).select('_id name email avatarUrl legalDocuments.clinicName');
    
    const ateliersWithServices = await Promise.all(ateliersRaw.map(async (atelier) => {
        const services = await db.Service.find({ providerId: atelier._id, isAvailable: true }).select('title basePrice category description images');
        return {
            id: atelier._id,
            name: atelier.legalDocuments?.clinicName || atelier.name,
            avatar: atelier.avatarUrl,
            services: services.map(s => ({
                id: s._id,
                title: s.title,
                price: s.basePrice,
                image: s.images?.[0] || null
            }))
        };
    }));

    const productsRaw = await db.Product.find({ status: 'active', isDeleted: false }).limit(10).select('name price category description images');
    const products = productsRaw.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || null
    }));

    return `
DỮ LIỆU HỆ THỐNG:
- THÚ CƯNG: ${JSON.stringify(pets)}
- ATELIERS/SERVICES: ${JSON.stringify(ateliersWithServices)}
- PRODUCTS: ${JSON.stringify(products)}

NHIỆM VỤ:
1. Bạn là chuyên gia PNetAI. Trả lời CỰC KỲ NGẮN GỌN, súc tích và đi thẳng vào vấn đề.
2. Ưu tiên sử dụng các thẻ [DATA: ...] để hiển thị thông tin thay vì mô tả bằng văn bản dài dòng.
3. Nếu giới thiệu Atelier, hãy liệt kê tên dịch vụ chính và kèm thẻ DATA ngay.
4. Trả lời bằng tiếng Việt, Markdown chuyên nghiệp.
`;
}

router.post('/chat', verifyToken, async (req, res) => {
    try {
        const { message, type = "general" } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        if (!AI_API_KEY) return res.status(500).json({ error: 'AI API Key is not configured' });

        const ai = new GoogleGenAI({ apiKey: AI_API_KEY });

        const dataContext = await getRealtimeContext(req.userId);
        const lastHistory = await db.AIHistory.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(3).select('question answer');
        const historyContext = lastHistory.reverse().map(h => `User: ${h.question}\nAI: ${h.answer}`).join('\n\n');

        const finalPrompt = `${dataContext}\n\nLỊCH SỬ:\n${historyContext || "Bắt đầu"}\n\nCÂU HỎI:\n${message}`;

        const response = await ai.models.generateContent({
            model: AI_MODEL,
            contents: finalPrompt,
            config: {
                maxOutputTokens: 800,
                temperature: 0.7,
            },
        });

        const answer = response.text;

        const chatHistory = new db.AIHistory({
            userId: req.userId,
            question: message,
            answer: answer,
            type: type,
            metadata: { model: AI_MODEL }
        });
        await chatHistory.save();

        res.json({ answer });

    } catch (error) {
        console.error('Gemini Error:', error.message);
        res.status(500).json({ error: `AI Error: ${error.message}` });
    }
});

router.get('/history', verifyToken, async (req, res) => {
    try {
        const history = await db.AIHistory.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;