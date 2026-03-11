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
HOSTNAME=localhost
PORT=9999
MONGO_URI=mongodb://localhost:27017/pnetai
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@pnetai.com
FRONTEND_URL=http://localhost:5173
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
