const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const httpErrors = require("http-errors");
const http = require("http");
const { initSocket } = require("./services/socket.service");
require("dotenv").config();

const connectDb = require ("./config/db");
const db = require("./models");
const ApiRouter = require("./routes/api.route");
const { initReminderCron } = require("./scripts/reminderService");

const app = express();
const server = http.createServer(app);
initSocket(server);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Pre-flight requests
app.options('*', cors(corsOptions));

app.use(bodyParser.json());
app.use(morgan("dev"));

app.get("/", async (req, res, next) => {
    res.status(200).send({ message: "Welcome to Restful API server" });
});

//Recieve request 
app.use("/", ApiRouter);

app.use(async (req, res, next) => {
    next(httpErrors.BadRequest("Bad request"));
});

app.use(async (err, req, res, next) => {
    res.status = err.status || 500,
        res.send({
            "error": {
                "status": err.status || 500,
                "message": err.message
            }
        });
})

const PORT = process.env.PORT || 9999;

server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
    //Connect database 
    connectDb();
    // Initialize notification cron jobs
    initReminderCron();
});