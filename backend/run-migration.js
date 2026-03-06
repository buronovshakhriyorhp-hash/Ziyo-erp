/**
 * Audit Logging Migration Skripti
 * Ishlatish: node run-migration.js
 * Joylashuv: backend/ papkasida
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// .env ni yuklash
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

        const sqlPath = path.join(__dirname, 'migrations', '001_create_audit_logs.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Migration fayli o\'qildi:', sqlPath);
        console.log('⚙️  SQL bajarilmoqda...');

        await client.query(sql);

        console.log('');
        console.log('✅ Migration muvaffaqiyatli bajarildi!');
        console.log('');

        // Tekshirish
        const { rows: tables } = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'erp' AND table_name = 'audit_logs'
        `);

        const { rows: triggers } = await client.query(`
            SELECT trigger_name, event_object_table 
            FROM information_schema.triggers 
            WHERE trigger_schema = 'erp' 
            AND trigger_name LIKE '%audit%'
            ORDER BY event_object_table
        `);

        console.log('📊 Jadval holati:');
        if (tables.length > 0) {
            console.log('   ✅ erp.audit_logs jadvali mavjud');
        } else {
            console.log('   ❌ erp.audit_logs jadvali TOPILMADI!');
        }

        console.log('');
        console.log('🎯 Triggerlar:');
        if (triggers.length === 0) {
            console.log('   ❌ Hech qanday trigger topilmadi!');
        } else {
            triggers.forEach(t => {
                console.log(`   ✅ ${t.trigger_name}  →  ${t.event_object_table}`);
            });
        }

        console.log('');
        console.log('🚀 Audit Logging tizimi tayyor!');

    } catch (error) {
        console.error('❌ Migration xatosi:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
