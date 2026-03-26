const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

// Database connection
const connectDb = require("./config/db");

// Simple routes first
const authRoutes = require("./routes/auth.route");
const dashboardRoutes = require("./routes/dashboard.route");

const app = express();

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Root
app.get("/", (req, res) => {
    res.status(200).send({ message: "Welcome to Restful API server" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        error: {
            status: err.status || 500,
            message: err.message
        }
    });
});

const HOSTNAME = process.env.HOSTNAME || "localhost";
const PORT = process.env.PORT || 9999;

async function start() {
    try {
        await connectDb();
        console.log('Database connected');
        
        app.listen(PORT, HOSTNAME, () => {
            console.log(`Simple server running at: http://${HOSTNAME}:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
