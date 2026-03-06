import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "erp_db",
    password: process.env.DB_PASSWORD || "postgres",
    port: parseInt(process.env.DB_PORT || "5432"),
});

const BOT_TOKEN = "8239416093:AAFRqA9J7Z9i4CUnDwmVyAXpG324ia20EQE";

async function run() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Check if telegram_bot_token exists
        const res = await client.query(`SELECT id FROM erp.system_settings WHERE key = 'telegram_bot_token'`);

        if (res.rows.length === 0) {
            // Insert
            await client.query(
                `INSERT INTO erp.system_settings (key, value, description) VALUES ($1, $2, $3)`,
                ["telegram_bot_token", BOT_TOKEN, "Telegram Bot Token for notifications"]
            );
            console.log("Inserted bot token.");
        } else {
            // Update
            await client.query(
                `UPDATE erp.system_settings SET value = $1 WHERE key = 'telegram_bot_token'`,
                [BOT_TOKEN]
            );
            console.log("Updated bot token.");
        }

        await client.query("COMMIT");
        console.log("Done.");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error:", error);
    } finally {
        client.release();
        pool.end();
    }
}

run();
