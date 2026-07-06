import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

const requiredDatabaseEnv = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_DATABASE"] as const;

const isMysqlSslEnabled = () => process.env.MYSQL_SSL?.toLowerCase() !== "false";

export const hasDatabaseConfig = () => requiredDatabaseEnv.every((key) => Boolean(process.env[key]));

export const getDbPool = () => {
    if (!hasDatabaseConfig()) {
        throw new Error("MySQL is not configured");
    }

    if (!pool) {
        const host = process.env.MYSQL_HOST as string;
        const user = process.env.MYSQL_USER as string;
        const database = process.env.MYSQL_DATABASE as string;

        const poolOptions: mysql.PoolOptions = {
            host,
            port: Number(process.env.MYSQL_PORT) || 3306,
            user,
            password: process.env.MYSQL_PASSWORD || "",
            database,
            waitForConnections: true,
            connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
            namedPlaceholders: true,
            timezone: 'Z',
        };

        if (isMysqlSslEnabled()) {
            poolOptions.ssl = {
                minVersion: "TLSv1.2",
                rejectUnauthorized: true,
            };
        }

        pool = mysql.createPool(poolOptions);
    }

    return pool;
};

export const initMysqlConnection = async () => {
    if (!hasDatabaseConfig()) {
        console.warn("MySQL env is incomplete; auth/history APIs will return 503, but signaling will run.");
        return;
    }

    const connection = await getDbPool().getConnection();
    connection.release();
    console.log("MySQL Connected");
};
