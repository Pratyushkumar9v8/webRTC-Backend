import { Request, Response } from "express";
import httpStatus from "http-status";
import { getChatsForMeeting } from "../models/chat.model";
import { getMeetingByCode } from "../models/meeting.model";

export const getMeetingChats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
        }

        const { meetingId: meetingCode } = req.params;
        if (!meetingCode) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "meetingCode is required" });
        }

        const meeting = await getMeetingByCode(meetingCode as string);
        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
        }

        const chats = await getChatsForMeeting(meeting.id);
        return res.json(chats);
    } catch (error) {
        console.error("Error in getMeetingChats:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};
