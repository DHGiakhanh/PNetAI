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

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_BASE_URL=https://api-merchant.payos.vn
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
- Backend: http://localhost:9999

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Run both backend & frontend |
| `npm run backend` | Run backend only |
| `npm run frontend` | Run frontend only |
| `npm run build:frontend` | Build frontend for production |
