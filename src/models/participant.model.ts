import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "../config/database";

export type ParticipantRecord = {
    id: number;
    meeting_id: number;
    user_id: number;
    joined_at: Date;
    left_at: Date | null;
};

type ParticipantRow = RowDataPacket & ParticipantRecord;

export const addParticipant = async (meetingId: number, userId: number) => {
    const [result] = await getDbPool().execute<ResultSetHeader>(
        "INSERT INTO participants (meeting_id, user_id) VALUES (:meetingId, :userId)",
        { meetingId, userId }
    );
    return result.insertId;
};

export const removeParticipant = async (meetingId: number, userId: number) => {
    await getDbPool().execute(
        "UPDATE participants SET left_at = CURRENT_TIMESTAMP WHERE meeting_id = :meetingId AND user_id = :userId AND left_at IS NULL",
        { meetingId, userId }
    );
};

export const getParticipantsForMeeting = async (meetingId: number) => {
    const [rows] = await getDbPool().execute<RowDataPacket[]>(
        `SELECT p.id, p.user_id, u.name, u.avatar_url, p.joined_at, p.left_at
         FROM participants p
         JOIN users u ON p.user_id = u.id
         WHERE p.meeting_id = :meetingId`,
        { meetingId }
    );
    return rows;
};
