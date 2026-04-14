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

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=pnetai2026@gmail.com
EMAIL_PASSWORD=zivm pndr pivm uuvn
EMAIL_FROM=noreply@yourapp.com

#Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dpdkaxctz
CLOUDINARY_API_KEY=364836787979468
CLOUDINARY_API_SECRET=4ufK4Yr6qvtSlX8XMvz9jbP8j-w

GOOGLE_CLIENT_ID=536916141054-rn2hfsdluj0gdk8ca7iplqu2pn5g4tv4.apps.googleusercontent.com

# Frontend URL
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
