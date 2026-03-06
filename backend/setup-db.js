const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: !process.env.DATABASE_URL ? (process.env.DB_HOST || 'localhost') : undefined,
    port: !process.env.DATABASE_URL ? (parseInt(process.env.DB_PORT || '5432')) : undefined,
    database: !process.env.DATABASE_URL ? process.env.DB_NAME : undefined,
    user: !process.env.DATABASE_URL ? process.env.DB_USER : undefined,
    password: !process.env.DATABASE_URL ? process.env.DB_PASSWORD : undefined,
    ssl: {
        rejectUnauthorized: false
    },
});

async function run() {
    console.log('🚀 Ziyo Chashmasi — Ma\'lumotlar bazasini sozlash boshlandi...');
    const client = await pool.connect();

    try {
        // 1. Schema mavjudligini tekshirish
        console.log('🔗 Schemani tekshirish (erp)...');
        await client.query('CREATE SCHEMA IF NOT EXISTS erp');
        await client.query('SET search_path = erp');

        // 2. Asosiy jadvallar (users, roles va h.k.)
        const { rows: tableExists } = await client.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'erp' AND table_name = 'users')
        `);

        if (!tableExists[0].exists) {
            console.log('📦 Asosiy schema topilmadi. schema.sql yuklanmoqda...');
            const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
            await client.query(schemaSql);
            console.log('✅ Asosiy schema (schema.sql) muvaffaqiyatli saqlandi.');
        } else {
            console.log('✅ Asosiy jadvallar allaqachon mavjud.');
        }

        // 3. Migratsiyalarni tekshirish va bajarish
        const migrations = [
            { id: '001', name: 'audit_logs', file: '001_create_audit_logs.sql', table: 'audit_logs' },
            { id: '002', name: 'salary_system', file: '002_teacher_salary_system.sql', table: 'teacher_salary_settings' },
            { id: '003', name: 'system_settings', file: '003_create_system_settings.sql', table: 'system_settings' }
        ];

        for (const m of migrations) {
            const { rows: mExists } = await client.query(`
                SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'erp' AND table_name = $1)
            `, [m.table]);

            if (!mExists[0].exists) {
                console.log(`📦 Migratsiya bajarilmoqda: ${m.file} (${m.name})...`);
                const sql = fs.readFileSync(path.join(__dirname, 'migrations', m.file), 'utf8');
                await client.query(sql);
                console.log(`✅ Migratsiya muvaffaqiyatli: ${m.name}`);
            } else {
                console.log(`✅ ${m.name} allaqachon mavjud.`);
            }
        }

        // 4. Admin foydalanuvchini tekshirish
        console.log('👤 Adminni tekshirish...');
        const { rows: roles } = await client.query('SELECT * FROM roles');
        const phone = '+998941009122';
        const { rows: [admin] } = await client.query(
            'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.phone = $1',
            [phone]
        );

        if (admin) {
            console.log(`✅ Admin foydalanuvchi mavjud (Rol: ${admin.role_name})`);
            console.log('🔄 Admin parolini yangilash...');
            const hash = await bcrypt.hash('@GUMSMASS645', 12);
            await client.query(
                'UPDATE users SET password_hash = $1, is_active = true, deleted_at = NULL WHERE id = $2',
                [hash, admin.id]
            );
        } else {
            console.log('⚠️ Admin topilmadi. Yaratilmoqda...');
            const adminRole = roles.find(r => r.name === 'admin');
            const hash = await bcrypt.hash('@GUMSMASS645', 12);
            await client.query(
                `INSERT INTO users (role_id, first_name, last_name, phone, password_hash, is_active)
                 VALUES ($1, 'Admin', 'User', $2, $3, true)`,
                [adminRole.id, phone, hash]
            );
            console.log('✅ Admin yaratildi.');
        }

        console.log('\n✨ BARCHA AMALLAR MUVAFFAQIYATLI YAKUNLANDI!');
        console.log('Siz endi tizimga kirishingiz mumkin.');

    } catch (err) {
        console.error('\n❌ XATOLIK YUZ BERDI:');
        console.error(err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
