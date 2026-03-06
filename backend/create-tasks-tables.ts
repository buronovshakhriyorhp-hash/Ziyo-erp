import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'erp_admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'erp_db',
    password: process.env.DB_PASSWORD || 'secret123',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function main() {
    try {
        console.log('Qo\\'shimcha vazifalar jadvallarini yaratish boshlandi...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS erp.group_tasks (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES erp.groups(id) ON DELETE CASCADE,
                teacher_id INTEGER REFERENCES erp.users(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                task_type VARCHAR(50) DEFAULT 'homework', -- 'homework' or 'gamified'
                xp_reward INTEGER DEFAULT 50, -- For gamification
                deadline DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS erp.task_submissions (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES erp.group_tasks(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES erp.users(id) ON DELETE CASCADE,
                content_url TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'graded', 'rejected'
                ai_feedback TEXT,
                earned_xp INTEGER DEFAULT 0,
                graded_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            ALTER TABLE erp.group_tasks ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;
        `);
        console.log('✅ Jadvallar muvaffaqiyatli yaratildi!');
    } catch (e) {
        console.error('Xatolik:', e);
    } finally {
        await pool.end();
    }
}

main();
