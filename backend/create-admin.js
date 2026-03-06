/**
 * Admin foydalanuvchi yaratish skripti
 * Ishlatish: node create-admin.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function createAdmin() {
    const client = await pool.connect();
    try {
        await client.query('SET search_path = erp');

        // Mavjud foydalanuvchilarni tekshirish
        const { rows: existing } = await client.query(
            `SELECT u.id, u.phone, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.deleted_at IS NULL`
        );

        console.log('\n📋 Bazadagi mavjud foydalanuvchilar:');
        if (existing.length === 0) {
            console.log('   (yo\'q — bo\'sh)');
        } else {
            existing.forEach(u => console.log(`   ID:${u.id} | ${u.phone} | ${u.role}`));
        }

        // Admin rol ID ni topish
        const { rows: [adminRole] } = await client.query(
            `SELECT id FROM roles WHERE name = 'admin' LIMIT 1`
        );

        if (!adminRole) {
            console.error('❌ Admin roli topilmadi! Avval schema.sql ni ishlatib rollarni yarating.');
            process.exit(1);
        }

        const phone = '+998941009122';
        const password = '@GUMSMASS645';

        // Telefon allaqachon borligini tekshirish
        const { rows: [phoneCheck] } = await client.query(
            `SELECT id FROM users WHERE phone = $1 AND deleted_at IS NULL`, [phone]
        );

        if (phoneCheck) {
            console.log(`\n⚠️  ${phone} raqami allaqachon mavjud (ID: ${phoneCheck.id})`);
            console.log('Parolni yangilaymiz...');
            const hash = await bcrypt.hash(password, 12);
            await client.query(
                `UPDATE users SET password_hash = $1, is_active = true WHERE id = $2`,
                [hash, phoneCheck.id]
            );
            console.log('✅ Parol yangilandi!');
        } else {
            // Yangi admin yaratish
            const hash = await bcrypt.hash(password, 12);
            const { rows: [newUser] } = await client.query(
                `INSERT INTO users (role_id, first_name, last_name, phone, password_hash, is_active)
                 VALUES ($1, 'Admin', 'User', $2, $3, true)
                 RETURNING id`,
                [adminRole.id, phone, hash]
            );
            console.log(`\n✅ Admin yaratildi! ID: ${newUser.id}`);
        }

        console.log('\n🔑 Login ma\'lumotlari:');
        console.log(`   📱 Phone:    ${phone}`);
        console.log(`   🔐 Password: ${password}`);
        console.log('\n🚀 Endi npm run dev ni ishga tushirib, API test qilishingiz mumkin!');

    } catch (err) {
        console.error('❌ Xato:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createAdmin();
