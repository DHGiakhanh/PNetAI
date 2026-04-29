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
MONGO_DIRECT_URI=mongodb://khanhdhgqe180127_db_user:AAbZWUEsrMXN6J0V@ac-ffalx1o-shard-00-00.1cqxyoo.mongodb.net:27017,ac-ffalx1o-shard-00-01.1cqxyoo.mongodb.net:27017,ac-ffalx1o-shard-00-02.1cqxyoo.mongodb.net:27017/test?ssl=true&replicaSet=atlas-gpxv6i-shard-0&authSource=admin&retryWrites=true&w=majority

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

If you see `querySrv ECONNREFUSED` on Windows, keep `MONGO_URI` as the Atlas SRV string and add `MONGO_DIRECT_URI` as a fallback. This avoids the SRV DNS lookup that sometimes fails in Node or the VS Code MongoDB extension even when MongoDB Compass still connects.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Run both backend & frontend |
| `npm run backend` | Run backend only |
| `npm run frontend` | Run frontend only |
| `npm run build:frontend` | Build frontend for production |
