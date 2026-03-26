const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const httpErrors = require("http-errors");
require("dotenv").config();

const connectDb = require ("./config/db");
const db = require("./models");
const ApiRouter = require("./routes/api.route");
const { ensureDefaultAdmin } = require("./config/seedDefaultAdmin");

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(morgan("dev"));

// Static uploads (for partner licenses, etc.)
app.use("/uploads", express.static("uploads"));

app.get("/", async (req, res, next) => {
    res.status(200).send({ message: "Welcome to Restful API server" });
});

//Recieve request 
app.use("/", ApiRouter);

app.use(async (err, req, res, next) => {
    res.status = err.status || 500,
        res.send({
            "error": {
                "status": err.status || 500,
                "message": err.message
            }
        });
})

const HOSTNAME = process.env.HOSTNAME || "localhost";
const PORT = process.env.PORT || 9999;

async function start() {
    await connectDb();
    await ensureDefaultAdmin();

    app.listen(PORT, HOSTNAME, () => {
        console.log(`Server running at: http://${HOSTNAME}:${PORT}`);
    });
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});