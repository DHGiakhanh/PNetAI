# PNetAI - E-commerce Application

## How to Run

### Prerequisites
- Node.js (v16+)
- MongoDB running on `localhost:27017`

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment

**Backend** - Create `Backend/.env`:
```env
# Server Configuration
HOSTNAME=localhost
PORT=9999

# Database
MONGO_URI=mongodb+srv://khanhdhgqe180127_db_user:AAbZWUEsrMXN6J0V@pnetai.1cqxyoo.mongodb.net/
MONGO_DIRECT_URI=mongodb://khanhdhgqe180127_db_user:AAbZWUEsrMXN6J0V@ac-ffalx1o-shard-00-00.1cqxyoo.mongodb.net:27017,...

# JWT — must match the AI Chatbot Server's JWT_SECRET
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_BASE_URL=https://api-merchant.payos.vn

# AI Chatbot Provider
# Set to 'team' to route through the Python AI Chatbot Server
# Set to 'openrouter' to use the OpenRouter / Gemini fallback directly
CHATBOT_PROVIDER=team
CHATBOT_URL=http://localhost:8000/api   # base URL of the Python AI Chatbot Server
```

**Frontend** - Create `Frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:9999
```

### 3. Run Application

**Run both Backend & Frontend:**
```bash
npm run dev
```

**Or run separately:**
```bash
# Backend only
npm run backend

# Frontend only
npm run frontend
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:9999

If you see `querySrv ECONNREFUSED` on Windows, keep `MONGO_URI` as the Atlas SRV string and add `MONGO_DIRECT_URI` as a fallback. This avoids the SRV DNS lookup that sometimes fails in Node or the VS Code MongoDB extension even when MongoDB Compass still connects.

---

## AI Chatbot Integration

The floating chat widget (`FloatingChatAgent`) is powered by an external **Python AI Chatbot Server** (FastAPI + LangGraph). This section explains the full integration contract between the two systems.

### Architecture Overview

```
┌─────────────────────┐     POST /api/chatbot/chat       ┌──────────────────────────┐
│  React Frontend     │ ──────────────────────────────►  │  Node.js Backend         │
│  FloatingChatAgent  │ ◄──────────────────────────────  │  chatbot.route.js        │
│                     │   { answer, sessionId }          │                          │
└─────────────────────┘                                  └───────────┬──────────────┘
                                                                     │ POST /api/v1/chat
                                                                     │ Authorization: Bearer <JWT>
                                                                     │ { query, session_id, location, stream }
                                                                     ▼
                                                         ┌──────────────────────────┐
                                                         │  Python AI Chatbot Server│
                                                         │  FastAPI + LangGraph     │
                                                         │  (localhost:8000)        │
                                                         └───────────┬──────────────┘
                                                                     │
                                                         ┌───────────▼──────────────┐
                                                         │  MongoDB Cloud (shared)  │
                                                         │  Products, Services,     │
                                                         │  Pets, Sessions, History │
                                                         └──────────────────────────┘
```

### Provider Configuration

The chatbot provider is controlled by the `CHATBOT_PROVIDER` environment variable in `Backend/.env`:

| Value | Behaviour |
|-------|-----------|
| `team` | Forwards all chat requests to the Python AI Chatbot Server. No history is read from or written to the Node.js `AIHistory` MongoDB collection — the AI Server handles session persistence internally. |
| `openrouter` | Calls OpenRouter / Gemini directly. Node.js reads the last 3 conversations from `AIHistory`, injects them as context, and saves new messages back to `AIHistory` after each turn. |

### Request / Response Contract

When `CHATBOT_PROVIDER=team`, the Node.js backend transforms the client payload and forwards it to the AI Server.

**Client → Node.js (POST `/api/chatbot/chat`)**
```json
{
  "message": "Find a vet near me",
  "userId": "user-object-id",
  "sessionId": "uuid-or-null",
  "location": {
    "lat": 10.762622,
    "lng": 106.660172,
    "address": "Ho Chi Minh City",
    "source": "browser"
  }
}
```

**Node.js → AI Server (POST `/api/v1/chat`)**
```json
{
  "query": "Find a vet near me",
  "session_id": "uuid-or-null",
  "stream": false,
  "location": {
    "coordinates": [106.660172, 10.762622],
    "addressName": "Ho Chi Minh City"
  }
}
```
> **Note:** The `Authorization: Bearer <JWT>` header from the client is forwarded **unchanged** to the AI Server so that it can decode the user's identity and personalise responses (e.g. retrieve the user's pets and order history from MongoDB).

**AI Server → Node.js → Client**
```json
{
  "answer": "Here are the nearest vet clinics for you…",
  "sessionId": "uuid-returned-by-ai-server"
}
```

### JWT Claim Compatibility

Node.js signs tokens with the claim key **`userId`** (camelCase):
```js
jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' })
```

The Python AI Server's `AuthMiddleware` is configured to accept `sub`, `user_id`, **and `userId`**, so the same token works across both systems without any re-signing.

> **Important:** Both systems must share the same `JWT_SECRET` value.

### Session Management (Transient Chat)

The integration follows a **transient single-session** model:

- Each time the user opens the chat widget, they start **fresh** — no historical messages are loaded into the UI.
- The `sessionId` is stored in React component state (not `localStorage`), so it is automatically discarded on page refresh.
- When the user **logs in or logs out**, the chat widget detects the token change and immediately resets the current conversation and `sessionId` to `null`.
- The first message of every new session is sent with `sessionId: null`, which instructs the AI Server to create a brand-new session UUID that is then echoed back and stored in state for subsequent messages in the same session.
- The AI Server stores session history and summaries internally to enable future personalisation features, but this is entirely transparent to the website.

### Geolocation Handling

The frontend collects the user's location in two ways:
1. **Profile location** — coordinates saved in the user's MongoDB document (`location.coordinates`).
2. **Browser geolocation** — requested via `navigator.geolocation.getCurrentPosition()` only when the message contains proximity keywords such as *"gần tôi"*, *"near me"*, *"gần đây"*, etc.

The Node.js backend converts the location from `{ lat, lng, address }` to the AI Server's expected format `{ coordinates: [lng, lat], addressName }` before forwarding.

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Run both backend & frontend |
| `npm run backend` | Run backend only |
| `npm run frontend` | Run frontend only |
| `npm run build:frontend` | Build frontend for production |
