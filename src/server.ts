import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer, Server as HttpServer } from "node:http";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/users.routes"
import dashboardRoutes from "./routes/dashboard.routes"
import chatRoutes from "./routes/chat.routes"
import { connectToSocket } from './controllers/socketManager';
import { initMysqlConnection } from './config/database';
import { initSchema } from './config/init_schema';

const app: Application = express();
const server: HttpServer = createServer(app);

const PORT = Number(process.env.PORT) || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.FRONT_URI;
const allowedOrigins = (FRONTEND_URL ? FRONTEND_URL.split(",") : ["http://localhost:5173", "http://127.0.0.1:5173"])
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            const allowed = allowedOrigins.includes(origin);
            callback(null, allowed);
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use(helmet());
app.use(cookieParser());

// Health check before rate limiter
app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for real-time app upgrade/reconnects
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/chat", chatRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ 
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message 
    });
});

const start = async () => {
    try {
        await initMysqlConnection();
        await initSchema();

        server.listen(PORT, () => {
            console.log(`Server Started on port ${PORT}`);
            connectToSocket(server);
        });
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}

start();
