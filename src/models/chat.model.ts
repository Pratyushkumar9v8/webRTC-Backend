import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "../config/database";

export type ChatRecord = {
    id: number;
    meeting_id: number;
    user_id: number;
    message: string;
    created_at: Date;
};

type ChatRow = RowDataPacket & ChatRecord;

export const saveChatMessage = async (meetingId: number, userId: number, message: string) => {
    const [result] = await getDbPool().execute<ResultSetHeader>(
        "INSERT INTO chats (meeting_id, user_id, message) VALUES (:meetingId, :userId, :message)",
        { meetingId, userId, message }
    );
    
    const [rows] = await getDbPool().execute<ChatRow[]>(
        "SELECT id, meeting_id, user_id, message, created_at FROM chats WHERE id = :id LIMIT 1",
        { id: result.insertId }
    );
    
    return rows[0] ?? null;
};

export const getChatsForMeeting = async (meetingId: number) => {
    const [rows] = await getDbPool().execute<ChatRow[]>(
        `SELECT c.id, c.meeting_id, c.user_id, c.message, c.created_at, u.name as sender_name, u.avatar_url 
         FROM chats c
         JOIN users u ON c.user_id = u.id
         WHERE c.meeting_id = :meetingId
         ORDER BY c.created_at ASC`,
        { meetingId }
    );
    return rows;
};
