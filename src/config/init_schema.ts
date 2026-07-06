import { getDbPool } from "./database";

export const initSchema = async () => {
    const pool = getDbPool();

    // // Create users table
    // await pool.execute(`
    //     CREATE TABLE IF NOT EXISTS users (
    //         id INT AUTO_INCREMENT PRIMARY KEY,
    //         google_id VARCHAR(255) UNIQUE,
    //         email VARCHAR(255) NOT NULL UNIQUE,
    //         name VARCHAR(255) NOT NULL,
    //         avatar_url TEXT,
    //         status VARCHAR(50) DEFAULT 'offline',
    //         timezone VARCHAR(100) DEFAULT 'UTC',
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    //     )
    // `);

    // // Create meetings table
    // await pool.execute(`
    //     CREATE TABLE IF NOT EXISTS meetings (
    //         id INT AUTO_INCREMENT PRIMARY KEY,
    //         meeting_code VARCHAR(255) NOT NULL UNIQUE,
    //         title VARCHAR(255) DEFAULT 'New Meeting',
    //         host_id INT NOT NULL,
    //         scheduled_for TIMESTAMP NULL,
    //         duration INT DEFAULT 60,
    //         status VARCHAR(50) DEFAULT 'active',
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
    //     )
    // `);

    // // Create participants table
    // await pool.execute(`
    //     CREATE TABLE IF NOT EXISTS participants (
    //         id INT AUTO_INCREMENT PRIMARY KEY,
    //         meeting_id INT NOT NULL,
    //         user_id INT NOT NULL,
    //         joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         left_at TIMESTAMP NULL,
    //         FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    //         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    //     )
    // `);

    // // Create chats table
    // await pool.execute(`
    //     CREATE TABLE IF NOT EXISTS chats (
    //         id INT AUTO_INCREMENT PRIMARY KEY,
    //         meeting_id INT NOT NULL,
    //         user_id INT NOT NULL,
    //         message TEXT NOT NULL,
    //         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //         FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    //         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    //     )
    // `);

    console.log("Database schema initialized successfully.");
};
