/**
 * Teacher Salary & HR Management Migration Skripti
 * Ishlatish: node migrate-salary.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔗 PostgreSQL ga ulanish...');

        const sqlPath = path.join(__dirname, 'migrations', '002_teacher_salary_system.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Migration fayli o\'qildi:', sqlPath);
        console.log('⚙️  SQL bajarilmoqda...');

        await client.query(sql);

        console.log('✅ Migration muvaffaqiyatli bajarildi!');

    } catch (error) {
        console.error('❌ Migration xatosi:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
