import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "../config/database";

export type UserRecord = {
    id: number;
    google_id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    status: string;
    timezone: string;
};

type UserRow = RowDataPacket & UserRecord;

export const upsertGoogleUser = async (user: Omit<UserRecord, "id" | "status" | "timezone">) => {
    const [result] = await getDbPool().execute<ResultSetHeader>(
        `INSERT INTO users (google_id, email, name, avatar_url)
         VALUES (:googleId, :email, :name, :avatarUrl)
         ON DUPLICATE KEY UPDATE
            email = VALUES(email),
            name = VALUES(name),
            avatar_url = VALUES(avatar_url),
            updated_at = CURRENT_TIMESTAMP`,
        {
            googleId: user.google_id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
        },
    );

    const userId = result.insertId || await getUserIdByGoogleId(user.google_id);
    return getUserById(userId);
};

export const getUserIdByGoogleId = async (googleId: string) => {
    const [rows] = await getDbPool().execute<UserRow[]>(
        "SELECT id FROM users WHERE google_id = :googleId LIMIT 1",
        { googleId },
    );

    if (!rows[0]) {
        throw new Error("User not found");
    }

    return rows[0].id;
};

export const getUserById = async (id: number) => {
    const [rows] = await getDbPool().execute<UserRow[]>(
        "SELECT id, google_id, email, name, avatar_url, status, timezone FROM users WHERE id = :id LIMIT 1",
        { id },
    );

    return rows[0] ?? null;
};

export const updateUserStatus = async (id: number, status: string) => {
    await getDbPool().execute(
        "UPDATE users SET status = :status WHERE id = :id",
        { status, id }
    );
};

export const updateUserTimezone = async (id: number, timezone: string) => {
    await getDbPool().execute(
        "UPDATE users SET timezone = :timezone WHERE id = :id",
        { timezone, id }
    );
};
