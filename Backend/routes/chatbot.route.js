const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const axios = require('axios');
const db = require('../models');
const verifyToken = require('../middlewares/verifyToken');

const AI_API_KEY = process.env.AI_API_KEY;           // OpenRouter API key
const AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash';
const AI_BASE_URL = 'https://openrouter.ai/api/v1';

// Middleware tùy chỉnh để giải mã token nếu có (không bắt buộc)
const optionalVerifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        req.userId = null;
        return next();
    }
    const bearer = token.split(' ');
    const bearerToken = bearer[1];
    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) req.userId = null;
        else req.userId = decoded.userId;
        next();
    });
};

// Helper function to build the data context
async function getRealtimeContext(userId) {
    try {
        // Fetch base data
        const queries = [
            db.User.find({ role: 'service_provider', status: 'active' })
                .limit(5)
                .select('_id name email avatarUrl legalDocuments.clinicName location'),
            db.Product.find({ status: 'active', isDeleted: false })
                .limit(10)
                .select('name price category description images')
        ];

        // Only fetch pets if userId exists
        if (userId) {
            queries.push(db.Pet.find({ user: userId }).select('name breed species age weightKg healthStatus avatarUrl'));
        }

        const results = await Promise.all(queries);
        const ateliersRaw = results[0];
        const productsRaw = results[1];
        const pets = userId ? results[2] : [];

        // Process ateliers
        const ateliersWithServices = await Promise.all(ateliersRaw.map(async (atelier) => {
            const services = await db.Service.find({ providerId: atelier._id, isAvailable: true })
                .select('title basePrice category description images')
                .limit(3);
                
            return {
                id: atelier._id,
                name: atelier.legalDocuments?.clinicName || atelier.name || 'Atelier',
                avatar: atelier.avatarUrl,
                address: atelier.location?.addressName || 'Liên hệ để biết địa chỉ',
                services: services.map(s => ({
                    id: s._id,
                    title: s.title,
                    price: s.basePrice,
                    image: s.images && s.images.length > 0 ? s.images[0] : null
                }))
            };
        }));

        const products = productsRaw.map(p => ({
            id: p._id,
            name: p.name || 'Sản phẩm',
            price: p.price,
            image: p.images && p.images.length > 0 ? p.images[0] : null
        }));

        let userStatus = "";
        if (!userId) {
            userStatus = "Khách vãng lai (Chưa đăng nhập).";
        } else if (pets.length === 0) {
            userStatus = "Thành viên (Đã đăng nhập nhưng chưa thêm thú cưng).";
        } else {
            userStatus = `Chủ nuôi (Đã đăng nhập và có ${pets.length} bé thú cưng).`;
        }

        return `
TRẠNG THÁI NGƯỜI DÙNG: ${userStatus}

DỮ LIỆU HỆ THỐNG HIỆN TẠI:
- THÚ CƯNG CỦA HỌ: ${pets.length > 0 ? JSON.stringify(pets) : "Trống."}
- DANH SÁCH ATELIERS & DỊCH VỤ: ${ateliersWithServices.length > 0 ? JSON.stringify(ateliersWithServices) : "Trống."}
- SẢN PHẨM CỬA HÀNG: ${products.length > 0 ? JSON.stringify(products) : "Trống."}

YÊU CẦU GỢI Ý:
1. Nếu là Khách vãng lai hoặc chưa có thú cưng: Tập trung giới thiệu các dịch vụ Ateliers nổi bật và Sản phẩm bán chạy. Khuyến khích họ đăng nhập/thêm thú cưng để được tư vấn sức khỏe cá nhân hóa.
2. Nếu đã có thú cưng: Ưu tiên tư vấn dựa trên giống loài, cân nặng và tình trạng sức khỏe của bé. Gợi ý sản phẩm/dịch vụ phù hợp với hồ sơ bé.
3. Luôn trả lời bằng văn bản tự nhiên khi nói về thú cưng. Dùng thẻ [DATA: ...] cho Sản phẩm/Atelier.
`;
    } catch (error) {
        console.error("Error loading context data:", error);
        return "Dữ liệu hệ thống hiện đang bận.";
    }
}

router.post('/chat', optionalVerifyToken, async (req, res) => {
    try {
        const { message, type = "general" } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        if (!AI_API_KEY) return res.status(500).json({ error: 'AI API Key is not configured' });

        const dataContext = await getRealtimeContext(req.userId);
        const lastHistory = req.userId 
            ? await db.AIHistory.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(3).select('question answer')
            : [];
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
                max_tokens: 2000,
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

        // Chỉ lưu lịch sử nếu user đã đăng nhập
        if (req.userId) {
            const chatHistory = new db.AIHistory({
                userId: req.userId,
                question: message,
                answer: answer,
                type: type,
                metadata: { model: AI_MODEL }
            });
            await chatHistory.save();
        }

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