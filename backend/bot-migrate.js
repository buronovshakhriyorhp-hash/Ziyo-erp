/**
 * Bot jadvallarini yaratuvchi migratsiya skripti
 * node bot-migrate.js
 */
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('SET search_path = erp');
        console.log('🔄 Bot tables migration boshlandi...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS bot_users (
                id                    SERIAL PRIMARY KEY,
                telegram_id           BIGINT UNIQUE NOT NULL,
                username              VARCHAR(100),
                first_name            VARCHAR(100) NOT NULL DEFAULT 'Foydalanuvchi',
                last_name             VARCHAR(100),
                language              VARCHAR(5) NOT NULL DEFAULT 'uz' CHECK (language IN ('uz', 'ru')),
                notifications_enabled BOOLEAN NOT NULL DEFAULT true,
                student_id            INT REFERENCES users(id) ON DELETE SET NULL,
                created_at            TIMESTAMP DEFAULT NOW(),
                updated_at            TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ bot_users jadvali tayyor');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_id ON bot_users(telegram_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_bot_users_student_id  ON bot_users(student_id);`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS bot_registrations (
                id          SERIAL PRIMARY KEY,
                telegram_id BIGINT NOT NULL,
                full_name   VARCHAR(200) NOT NULL,
                phone       VARCHAR(30) NOT NULL,
                course_id   INT REFERENCES courses(id) ON DELETE SET NULL,
                course_name VARCHAR(200),
                status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'contacted', 'enrolled', 'rejected')),
                notes       TEXT,
                created_at  TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ bot_registrations jadvali tayyor');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_bot_registrations_status   ON bot_registrations(status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_bot_registrations_telegram ON bot_registrations(telegram_id);`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id         SERIAL PRIMARY KEY,
                title      VARCHAR(300) NOT NULL,
                content    TEXT NOT NULL,
                sent_count INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ announcements jadvali tayyor');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);`);

        console.log('🎉 Barcha bot jadvallari muvaffaqiyatli yaratildi!');
    } catch (err) {
        console.error('❌ Migration xatosi:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
