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

async function runIndexMigration() {
    const client = await pool.connect();
    try {
        const sqlPath = path.join(__dirname, 'migrations', '003_index_optimizations.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('✅ Index Migration Muvaffaqiyatli bajarildi!');
    } catch (error) {
        console.error('❌ Migration xatosi:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runIndexMigration();
