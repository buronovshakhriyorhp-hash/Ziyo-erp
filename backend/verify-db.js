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

async function verify() {
    console.log('🔍 Ma\'lumotlar bazasini tekshirish...');
    const client = await pool.connect();
    try {
        await client.query('SET search_path = erp');

        // 1. Roles tekshirish
        const { rows: roles } = await client.query('SELECT * FROM roles');
        console.log(`✅ Rollar soni: ${roles.length}`);

        // 2. Admin foydalanuvchini tekshirish
        const phone = '+998941009122';
        const { rows: [admin] } = await client.query(
            'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.phone = $1',
            [phone]
        );

        if (admin) {
            console.log(`✅ Admin foydalanuvchi topildi (ID: ${admin.id}, Rol: ${admin.role_name})`);
            console.log('🔄 Parolni qayta sozlash (@GUMSMASS645)...');
            const hash = await bcrypt.hash('@GUMSMASS645', 12);
            await client.query(
                'UPDATE users SET password_hash = $1, is_active = true, deleted_at = NULL WHERE id = $2',
                [hash, admin.id]
            );
            console.log('✅ Admin hisobi faollashtirildi va parol yangilandi.');
        } else {
            console.log('⚠️ Admin topilmadi. Yaratish...');
            const adminRole = roles.find(r => r.name === 'admin');
            if (!adminRole) throw new Error('Admin roli bazada mavjud emas!');

            const hash = await bcrypt.hash('@GUMSMASS645', 12);
            await client.query(
                `INSERT INTO users (role_id, first_name, last_name, phone, password_hash, is_active)
                 VALUES ($1, 'Admin', 'User', $2, $3, true)`,
                [adminRole.id, phone, hash]
            );
            console.log('✅ Yangi admin muvaffaqiyatli yaratildi.');
        }

    } catch (err) {
        console.error('❌ Xatolik:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

verify();
