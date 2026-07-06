import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { OAuth2Client } from "google-auth-library";
import { upsertGoogleUser } from "../models/user.model";
import { createMeeting, getMeetingsForUser, getMeetingByCode, addParticipantToMeeting } from "../models/meeting.model";

const getJwtSecret = () => process.env.JWT_SECRET || "development-secret";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const setAuthCookie = (res: Response, token: string) => {
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const googleAuth = async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "GOOGLE_CLIENT_ID is not configured" });
    }

    if (!idToken) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Google idToken is required" });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email || !payload.email_verified) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Google account could not be verified" });
        }

        const user = await upsertGoogleUser({
            google_id: payload.sub,
            email: payload.email,
            name: payload.name || payload.email,
            avatar_url: payload.picture || null,
        });

        if (!user) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Unable to create user" });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
        setAuthCookie(res, token);

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatar_url,
            },
        });
    } catch (error) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Google token" });
    }
};

export const logout = (_req: Request, res: Response) => {
    res.clearCookie("token");
    return res.json({ ok: true });
};

export const devLogin = async (_req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
        return res.status(httpStatus.FORBIDDEN).json({ message: "Not allowed in production" });
    }
    try {
        const user = await upsertGoogleUser({
            google_id: "dev-user-" + Date.now(),
            email: "dev@example.com",
            name: "Mobile Dev User",
            avatar_url: null,
        });
        if (!user) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Unable to create dev user" });
        
        const token = jwt.sign({ id: user.id, email: user.email }, getJwtSecret(), { expiresIn: "7d" });
        setAuthCookie(res, token);
        return res.json({ user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url } });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Dev login failed" });
    }
};

export const addToHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
        }

        const { meetingCode, title, scheduledFor, duration } = req.body;
        if (!meetingCode) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "meetingCode is required" });
        }

        let meeting = await getMeetingByCode(meetingCode);
        if (!meeting) {
            meeting = await createMeeting(Number(userId), meetingCode, title, scheduledFor, duration);
        } else if (meeting.host_id !== Number(userId)) {
            await addParticipantToMeeting(meeting.id, Number(userId));
        }
        return res.status(httpStatus.CREATED).json(meeting);
    } catch (error) {
        console.error("Error in addToHistory:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};

export const getUserHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
        }

        const meetings = await getMeetingsForUser(Number(userId));
        return res.json(meetings);
    } catch (error) {
        console.error("Error in getUserHistory:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};
