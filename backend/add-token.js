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

async function addToken() {
    const client = await pool.connect();
    try {
        await client.query('SET search_path = erp');
        const token = '8239416093:AAFRqA9J7Z9i4CUnDwmVyAXpG324ia20EQE';
        await client.query(
            `INSERT INTO system_settings (key, value) 
             VALUES ('telegram_bot_token', $1) 
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [token]
        );
        console.log('✅ Bot token system_settings jadvaliga qoshildi!');
    } catch (err) {
        console.error('❌ Xatolik:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

addToken();
