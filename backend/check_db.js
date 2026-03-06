// Clean test data and check payments columns
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ziyo_chashmasi',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function main() {
    const c = await pool.connect();
    await c.query('SET search_path = erp');

    // payments columns
    const { rows: pcols } = await c.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'erp' AND table_name = 'payments'
         ORDER BY ordinal_position`
    );
    console.log('payments cols:', pcols.map(r => r.column_name).join(', '));

    // group_enrollments existing
    const { rows: ge } = await c.query(
        `SELECT id, group_id, student_id, enrolled_at, status FROM group_enrollments WHERE deleted_at IS NULL`
    );
    console.log('group_enrollments:', JSON.stringify(ge));

    // Delete test-inserted record (id=3 from debug script)
    if (ge.some(r => r.id === 3)) {
        await c.query('DELETE FROM payment_debts WHERE enrollment_id = 3');
        await c.query('DELETE FROM group_enrollments WHERE id = 3');
        console.log('Cleaned test data (enrollment id=3)');
    } else {
        console.log('No test data to clean');
    }

    // Remaining enrollments
    const { rows: remaining } = await c.query(
        `SELECT id, group_id, student_id FROM group_enrollments WHERE deleted_at IS NULL`
    );
    console.log('Remaining enrollments:', JSON.stringify(remaining));

    c.release();
    await pool.end();
}

main().catch(e => { console.error(e.message, e.detail || ''); process.exit(1); });
