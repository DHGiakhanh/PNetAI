const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const axios = require('axios');
const db = require('../models');
const verifyToken = require('../middlewares/verifyToken');

const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'google/gemini-2.5-flash';
const AI_BASE_URL = 'https://openrouter.ai/api/v1';
const CHATBOT_PROVIDER = (process.env.CHATBOT_PROVIDER || 'openrouter').toLowerCase();
const CHATBOT_TIMEOUT_MS = Number(process.env.CHATBOT_TIMEOUT_MS) || 30000;
const CHATBOT_LANGUAGE = process.env.CHATBOT_LANGUAGE || 'vi';

const VIETNAMESE_REPLY_INSTRUCTION =
    'Luon tra loi bang tieng Viet tu nhien, de hieu, than thien. Neu cau hoi lien quan suc khoe thu cung va thieu thong tin, hay hoi lai truoc khi ket luan.';

// Middleware optional: có token thì lấy userId, không có/không hợp lệ thì xem như guest.
const optionalVerifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        req.userId = null;
        return next();
    }

    const bearer = token.split(' ');
    const bearerToken = bearer[1];
    if (!bearerToken) {
        req.userId = null;
        return next();
    }

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        req.userId = err ? null : decoded.userId;
        next();
    });
};

// UserId frontend gửi chỉ dùng để forward cho AI team. Backend không dùng id này để query DB.
function resolveForwardUserId(req) {
    return req.body.userId || req.userId || '';
}

// Location từ frontend chỉ forward sang AI team để recommend dịch vụ gần user.
function normalizeLocation(location) {
    if (!location || typeof location !== 'object') return null;

    const lat = Number(location.lat);
    const lng = Number(location.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
        lat,
        lng,
        address: typeof location.address === 'string' ? location.address : '',
        source: location.source === 'browser' ? 'browser' : 'profile',
    };
}

// Context nhẹ cho AI team: chỉ gửi userId để AI-server tự query MongoDB theo intent từng câu.
function buildTeamChatPayload(message, userId, history, location) {
    return {
        message,
        userId,
        location,
        language: CHATBOT_LANGUAGE,
        instructions: VIETNAMESE_REPLY_INSTRUCTION,
        history,
    };
}

// Context marketplace/pet chỉ dùng cho OpenRouter/Gemini tạm thời.
async function getRealtimeContext(userId) {
    try {
        const queries = [
            db.User.find({ role: 'service_provider', status: 'active' })
                .limit(5)
                .select('_id name email avatarUrl legalDocuments.clinicName location'),
            db.Product.find({ status: 'active', isDeleted: false })
                .limit(10)
                .select('name price category description images')
        ];

        if (userId) {
            queries.push(
                db.Pet.find({ user: userId })
                    .select('name breed species age weightKg healthStatus avatarUrl')
            );
        }

        const results = await Promise.all(queries);
        const ateliersRaw = results[0];
        const productsRaw = results[1];
        const pets = userId ? results[2] : [];

        const ateliersWithServices = await Promise.all(ateliersRaw.map(async (atelier) => {
            const services = await db.Service.find({ providerId: atelier._id, isAvailable: true })
                .select('title basePrice category description images')
                .limit(3);

            return {
                id: atelier._id,
                name: atelier.legalDocuments?.clinicName || atelier.name || 'Atelier',
                avatar: atelier.avatarUrl,
                address: atelier.location?.addressName || 'Lien he de biet dia chi',
                services: services.map((service) => ({
                    id: service._id,
                    title: service.title,
                    price: service.basePrice,
                    image: service.images && service.images.length > 0 ? service.images[0] : null
                }))
            };
        }));

        const products = productsRaw.map((product) => ({
            id: product._id,
            name: product.name || 'San pham',
            price: product.price,
            image: product.images && product.images.length > 0 ? product.images[0] : null
        }));

        let userStatus = '';
        if (!userId) {
            userStatus = 'Khach vang lai, chua dang nhap.';
        } else if (pets.length === 0) {
            userStatus = 'Nguoi dung da dang nhap nhung chua them thu cung.';
        } else {
            userStatus = `Nguoi dung da dang nhap va co ${pets.length} be thu cung.`;
        }

        return `
NGON NGU TRA LOI: Tieng Viet.
HUONG DAN GIONG VAN: ${VIETNAMESE_REPLY_INSTRUCTION}

TRANG THAI NGUOI DUNG: ${userStatus}

DU LIEU HE THONG HIEN TAI:
- THU CUNG CUA HO: ${pets.length > 0 ? JSON.stringify(pets) : 'Trong.'}
- DANH SACH ATELIERS VA DICH VU: ${ateliersWithServices.length > 0 ? JSON.stringify(ateliersWithServices) : 'Trong.'}
- SAN PHAM CUA HANG: ${products.length > 0 ? JSON.stringify(products) : 'Trong.'}

QUY TAC TRA LOI:
1. Neu la guest hoac chua co thu cung: tu van chung, goi y dang nhap/them thu cung khi can ca nhan hoa.
2. Neu da co thu cung: tu van dua tren giong loai, can nang va tinh trang suc khoe cua be.
3. Neu co nhieu thu cung va cau hoi khong ro dang hoi be nao, hay hoi lai truoc.
4. Luon tra loi bang tieng Viet tu nhien.
`;
    } catch (error) {
        console.error('Error loading context data:', error);
        return 'Du lieu he thong hien dang ban.';
    }
}

function joinUrl(baseUrl, path) {
    return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

// AI team có thể trả answer/reply/message/response, backend chuẩn hóa về answer cho frontend.
function extractTeamAnswer(data) {
    if (typeof data === 'string' && data.trim()) return data.trim();

    const candidates = [
        data?.answer,
        data?.reply,
        data?.message,
        data?.response,
        data?.data?.answer,
        data?.data?.reply,
        data?.data?.message,
        data?.data?.response,
    ];

    return candidates.find((value) => typeof value === 'string' && value.trim())?.trim();
}

// Adapter AI team: gửi userId để AI-server tự quyết query MongoDB field nào theo từng câu hỏi.
async function callTeamChatbot(payload) {
    if (!process.env.CHATBOT_URL) {
        throw new Error('CHATBOT_URL is not configured');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (process.env.CHATBOT_API_KEY) {
        headers.Authorization = `Bearer ${process.env.CHATBOT_API_KEY}`;
    }

    const response = await axios.post(
        joinUrl(process.env.CHATBOT_URL, 'chat'),
        payload,
        {
            headers,
            timeout: CHATBOT_TIMEOUT_MS,
        }
    );

    const answer = extractTeamAnswer(response.data);
    if (!answer) {
        throw new Error('Team chatbot response did not include answer/reply/message/response');
    }

    return {
        answer,
        provider: 'team',
        model: 'team-chatbot',
    };
}

// Adapter OpenRouter/Gemini tạm thời, giữ để dễ đổi provider bằng env.
async function callOpenRouter(message, userId, history) {
    if (!AI_API_KEY) {
        throw new Error('AI API Key is not configured');
    }

    const dataContext = await getRealtimeContext(userId);
    const historyContext = history
        .map((item) => `User: ${item.question}\nAI: ${item.answer}`)
        .join('\n\n');
    const systemPrompt = `${dataContext}\n\nLICH SU:\n${historyContext || 'Bat dau'}`;

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
                Authorization: `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                'X-Title': 'PNetAI Assistant',
            },
            timeout: CHATBOT_TIMEOUT_MS,
        }
    );

    return {
        answer: response.data.choices?.[0]?.message?.content || 'Xin lỗi, hiện tại AI chưa có phản hồi.',
        provider: 'openrouter',
        model: AI_MODEL,
    };
}

async function callConfiguredProvider(message, userId, history, location) {
    if (CHATBOT_PROVIDER === 'team') {
        return callTeamChatbot(buildTeamChatPayload(message, userId, history, location));
    }

    return callOpenRouter(message, userId, history);
}

// Endpoint chính cho frontend: frontend gửi message + userId, backend forward theo provider.
router.post('/chat', optionalVerifyToken, async (req, res) => {
    const { message, type = 'general' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        const forwardUserId = resolveForwardUserId(req);
        const verifiedUserId = req.userId || '';
        const location = normalizeLocation(req.body.location);
        const lastHistory = verifiedUserId
            ? await db.AIHistory.find({ userId: verifiedUserId })
                .sort({ createdAt: -1 })
                .limit(3)
                .select('question answer')
                .lean()
            : [];
        const history = lastHistory.reverse().map((item) => ({
            question: item.question,
            answer: item.answer,
        }));

        const aiResult = await callConfiguredProvider(
            message,
            CHATBOT_PROVIDER === 'team' ? forwardUserId : verifiedUserId,
            history,
            location
        );

        if (verifiedUserId) {
            const chatHistory = new db.AIHistory({
                userId: verifiedUserId,
                question: message,
                answer: aiResult.answer,
                type,
                metadata: {
                    provider: aiResult.provider,
                    model: aiResult.model,
                }
            });
            await chatHistory.save();
        }

        res.json({ answer: aiResult.answer });
    } catch (error) {
        console.error('AI gateway error:', error.response?.data || error.message);
        res.status(200).json({
            answer: 'Xin lỗi, hiện tại trợ lý AI đang bận. Bạn vui lòng thử lại sau ít phút nhé.',
        });
    }
});

// Lịch sử chat vẫn yêu cầu token vì đây là dữ liệu cá nhân.
router.get('/history', verifyToken, async (req, res) => {
    try {
        const history = await db.AIHistory.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
