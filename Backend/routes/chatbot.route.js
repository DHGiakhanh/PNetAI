const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../models');
const verifyToken = require('../middlewares/verifyToken');

const AI_API_KEY = process.env.AI_API_KEY;           // OpenRouter API key
const AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash';
const AI_BASE_URL = 'https://openrouter.ai/api/v1';

// Helper function to build the data context
async function getRealtimeContext(userId) {
    try {
        // Fetch all base data in parallel to ensure everything is loaded
        const [pets, ateliersRaw, productsRaw] = await Promise.all([
            db.Pet.find({ user: userId }).select('name breed species age weightKg healthStatus avatarUrl'),
            db.User.find({ role: 'service_provider', status: 'active' }).limit(5).select('_id name email avatarUrl legalDocuments.clinicName'),
            db.Product.find({ status: 'active', isDeleted: false }).limit(10).select('name price category description images')
        ]);

        // Process ateliers to include their services
        const ateliersWithServices = await Promise.all(ateliersRaw.map(async (atelier) => {
            const services = await db.Service.find({ providerId: atelier._id, isAvailable: true })
                .select('title basePrice category description images')
                .limit(3); // Limit services per atelier for context length
                
            return {
                id: atelier._id,
                name: atelier.legalDocuments?.clinicName || atelier.name || 'Atelier',
                avatar: atelier.avatarUrl,
                services: services.map(s => ({
                    id: s._id,
                    title: s.title,
                    price: s.basePrice,
                    image: s.images && s.images.length > 0 ? s.images[0] : null
                }))
            };
        }));

        // Process products
        const products = productsRaw.map(p => ({
            id: p._id,
            name: p.name || 'Sản phẩm',
            price: p.price,
            image: p.images && p.images.length > 0 ? p.images[0] : null
        }));

        return `
DỮ LIỆU HỆ THỐNG HIỆN TẠI (ĐÃ LOAD ĐỦ):
- THÚ CƯNG CỦA BẠN: ${pets.length > 0 ? JSON.stringify(pets) : "Không tìm thấy thú cưng nào."}
- DANH SÁCH ATELIERS & DỊCH VỤ: ${ateliersWithServices.length > 0 ? JSON.stringify(ateliersWithServices) : "Không có dịch vụ khả dụng."}
- SẢN PHẨM CỬA HÀNG: ${products.length > 0 ? JSON.stringify(products) : "Không có sản phẩm nào."}

YÊU CẦU:
1. Bạn là chuyên gia PNetAI. Dựa trên dữ liệu trên để trả lời.
2. Trả lời CỰC KỲ NGẮN GỌN.
3. Luôn ưu tiên dùng thẻ [DATA: ...] khi giới thiệu sản phẩm/dịch vụ/thú cưng.
`;
    } catch (error) {
        console.error("Error loading context data:", error);
        return "Dữ liệu hệ thống hiện đang bận, hãy trả lời dựa trên kiến thức chung.";
    }
}

router.post('/chat', verifyToken, async (req, res) => {
    try {
        const { message, type = "general" } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        if (!AI_API_KEY) return res.status(500).json({ error: 'AI API Key is not configured' });

        const dataContext = await getRealtimeContext(req.userId);
        const lastHistory = await db.AIHistory.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(3).select('question answer');
        const historyContext = lastHistory.reverse().map(h => `User: ${h.question}\nAI: ${h.answer}`).join('\n\n');

        const systemPrompt = `${dataContext}\n\nLỊCH SỬ:\n${historyContext || "Bắt đầu"}`;

        const response = await axios.post(
            `${AI_BASE_URL}/chat/completions`,
            {
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                ],
                max_tokens: 800,
                temperature: 0.7,
            },
            {
                headers: {
                    'Authorization': `Bearer ${AI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                    'X-Title': 'PNetAI Assistant',
                },
            }
        );

        const answer = response.data.choices?.[0]?.message?.content || 'Không có phản hồi từ AI.';

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
        console.error('AI Error:', error.response?.data || error.message);
        const errMsg = error.response?.data?.error?.message || error.message;
        res.status(500).json({ error: `AI Error: ${errMsg}` });
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