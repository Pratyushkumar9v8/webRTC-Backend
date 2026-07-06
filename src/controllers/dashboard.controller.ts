import { Request, Response } from "express";
import httpStatus from "http-status";
import { getMeetingsForUser, getUpcomingMeetings } from "../models/meeting.model";

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized" });
        }

        const allMeetings = await getMeetingsForUser(Number(userId));
        const upcomingMeetings = await getUpcomingMeetings(Number(userId));

        // Calculate simple stats
        const totalMeetings = allMeetings.length;
        const totalDuration = allMeetings.reduce((acc, curr) => acc + (curr.duration || 60), 0);
        
        return res.json({
            stats: {
                totalMeetings,
                totalDuration,
            },
            recentMeetings: allMeetings.slice(0, 5), // Top 5 recent
            upcomingMeetings: upcomingMeetings
        });
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
};
