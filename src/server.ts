import express, { Application, Request, Response } from 'express';
import { createServer, Server as HttpServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/users.routes"
import { connectToSocket } from './controllers/socketManager';

const app: Application = express();
const server: HttpServer = createServer(app);

const PORT = Number(process.env.PORT) || 8000;
const MONGO_URI = process.env.MONGO_URI;
const FRONT_URI = process.env.FRONT_URI;
if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
}

app.use(cors({
    origin: `${FRONT_URI}`,
    credentials: true
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use(helmet());
// app.use(mongoSanitize());

app.use(cookieParser());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use("/api/v1/users", userRoutes);



const start = async () => {
    try {
        const connectionDb = await mongoose.connect(MONGO_URI);
        console.log("Mongo DB Connected");

        server.listen(PORT, () => {
            console.log(`Server Started on port ${PORT}`);
            connectToSocket(server);
        });
    }
    catch (e) {
        console.log(e);
    }
}

start();