const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ziyocrud',
    password: process.env.DB_PASSWORD || '1234',
    port: process.env.DB_PORT || 5432,
});

const runMigration = async () => {
    const sqlPath = path.join(__dirname, 'migrations', '004_lms_gamification.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    try {
        await pool.query(sql);
        console.log('LMS and Gamification migration applied successfully!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
};

runMigration();
