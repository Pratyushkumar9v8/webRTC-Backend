import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "../config/database";

export type MeetingRecord = {
    id: number;
    meeting_code: string;
    title: string;
    host_id: number;
    scheduled_for: Date | null;
    duration: number;
    status: 'upcoming' | 'active' | 'completed';
    created_at: Date;
    updated_at: Date;
};

type MeetingRow = RowDataPacket & MeetingRecord;

export const createMeeting = async (
    hostId: number, 
    meetingCode: string, 
    title = 'New Meeting', 
    scheduledFor: Date | null = null, 
    duration = 60
) => {
    const [result] = await getDbPool().execute<ResultSetHeader>(
        `INSERT INTO meetings (host_id, meeting_code, title, scheduled_for, duration, status) 
         VALUES (:hostId, :meetingCode, :title, :scheduledFor, :duration, 'upcoming')`,
        { hostId, meetingCode, title, scheduledFor, duration }
    );

    return getMeetingById(result.insertId);
};

export const getMeetingById = async (id: number) => {
    const [rows] = await getDbPool().execute<MeetingRow[]>(
        "SELECT * FROM meetings WHERE id = :id LIMIT 1",
        { id }
    );
    return rows[0] ?? null;
};

export const getMeetingByCode = async (meetingCode: string) => {
    const [rows] = await getDbPool().execute<MeetingRow[]>(
        "SELECT * FROM meetings WHERE meeting_code = :meetingCode LIMIT 1",
        { meetingCode }
    );
    return rows[0] ?? null;
};

export const updateMeetingStatus = async (meetingId: number, status: 'upcoming' | 'active' | 'completed') => {
    await getDbPool().execute(
        "UPDATE meetings SET status = :status WHERE id = :meetingId",
        { status, meetingId }
    );
};

export const getMeetingsForUser = async (userId: number) => {
    // Get meetings where user is host OR participant
    const [rows] = await getDbPool().execute<MeetingRow[]>(
        `SELECT DISTINCT m.* 
         FROM meetings m
         LEFT JOIN participants p ON m.id = p.meeting_id
         WHERE m.host_id = :userId OR p.user_id = :userId
         ORDER BY m.created_at DESC
         LIMIT 200`,
        { userId }
    );
    return rows;
};

export const getUpcomingMeetings = async (userId: number) => {
    const [rows] = await getDbPool().execute<MeetingRow[]>(
        `SELECT * FROM meetings 
         WHERE host_id = :userId AND status = 'upcoming'
         ORDER BY scheduled_for ASC
         LIMIT 10`,
        { userId }
    );
    return rows;
};

export const addParticipantToMeeting = async (meetingId: number, userId: number) => {
    // Check if participant already exists to avoid duplicates
    const [existing] = await getDbPool().execute<RowDataPacket[]>(
        "SELECT id FROM participants WHERE meeting_id = :meetingId AND user_id = :userId",
        { meetingId, userId }
    );
    if (existing.length === 0) {
        await getDbPool().execute(
            "INSERT INTO participants (meeting_id, user_id) VALUES (:meetingId, :userId)",
            { meetingId, userId }
        );
    }
};
