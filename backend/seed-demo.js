/**
 * Demo faydalanuvchilarni yaratuvchi skript
 * Ishlatish: node seed-demo.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: !process.env.DATABASE_URL ? (process.env.DB_HOST || 'localhost') : undefined,
    port: !process.env.DATABASE_URL ? (parseInt(process.env.DB_PORT || '5432')) : undefined,
    database: !process.env.DATABASE_URL ? process.env.DB_NAME : undefined,
    user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
    password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query('SET search_path = erp');

        const demoUsers = [
            { role: 'student', phone: '+998901111111', first: 'Demo', last: 'Talaba' },
            { role: 'parent', phone: '+998902222222', first: 'Demo', last: 'Ota-ona' }
        ];

        for (const user of demoUsers) {
            const { rows: [roleRow] } = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [user.role]);
            if (!roleRow) {
                console.log(`Role ${user.role} not found, skipping...`);
                continue;
            }

            const { rows: [existing] } = await client.query('SELECT id FROM users WHERE phone = $1', [user.phone]);
            const hash = await bcrypt.hash('123456', 12);

            if (existing) {
                await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, existing.id]);
                console.log(`Updated existing ${user.role} demo account.`);
            } else {
                await client.query(
                    `INSERT INTO users (role_id, first_name, last_name, phone, password_hash, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
                    [roleRow.id, user.first, user.last, user.phone, hash]
                );
                console.log(`Created new ${user.role} demo account.`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
