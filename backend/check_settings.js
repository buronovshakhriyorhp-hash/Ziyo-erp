const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function check() {
    const client = await pool.connect();
    try {
        const { rows } = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'erp' 
                AND table_name = 'system_settings'
            );
        `);
        console.log('Result:', JSON.stringify(rows[0]));

        if (rows[0].exists) {
            const { rows: settings } = await client.query('SELECT * FROM erp.system_settings');
            console.log('Settings:', JSON.stringify(settings));
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
