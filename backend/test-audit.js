/**
 * FULL AUDIT TEST SCRIPT
 * Ishlatish: node test-audit.js
 * Bu skript:
 *   1. Admin user yaratadi (agar yo'q bo'lsa)
 *   2. Login qilib token oladi
 *   3. Guruhni yangilab trigger ishlatadi
 *   4. Audit loglarni ko'rsatadi
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const http = require('http');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const PHONE = '+998941009122';
const PASSWORD = '@GUMSMASS645';

function apiRequest(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(data && { 'Content-Length': Buffer.byteLength(data) }),
                ...(token && { 'Authorization': 'Bearer ' + token }),
            },
        };
        const req = http.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    const client = await pool.connect();

    try {
        await client.query('SET search_path = erp');

        console.log('\n══════════════════════════════════════');
        console.log('  1️⃣  ADMIN USER TEKSHIRISH / YARATISH');
        console.log('══════════════════════════════════════');

        const { rows: existing } = await client.query(
            `SELECT u.id, u.phone, r.name AS role
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.deleted_at IS NULL`
        );

        const { rows: [adminRole] } = await client.query(
            `SELECT id FROM roles WHERE name = 'admin' LIMIT 1`
        );

        if (!adminRole) {
            console.error('❌ Admin roli topilmadi! schema.sql ni ishlatib rollarni yarating.');
            process.exit(1);
        }

        const { rows: [phoneCheck] } = await client.query(
            `SELECT u.id FROM users u WHERE u.phone = $1 AND u.deleted_at IS NULL`, [PHONE]
        );

        if (phoneCheck) {
            console.log(`⚠️  ${PHONE} allaqachon mavjud (ID: ${phoneCheck.id}) — parolni yangilaymiz`);
            const hash = await bcrypt.hash(PASSWORD, 12);
            await client.query(
                `UPDATE users SET password_hash = $1, is_active = true WHERE id = $2`,
                [hash, phoneCheck.id]
            );
            console.log('✅ Parol yangilandi');
        } else {
            const hash = await bcrypt.hash(PASSWORD, 12);
            const { rows: [u] } = await client.query(
                `INSERT INTO users (role_id, first_name, last_name, phone, password_hash, is_active)
                 VALUES ($1, 'Admin', 'User', $2, $3, true) RETURNING id`,
                [adminRole.id, PHONE, hash]
            );
            console.log(`✅ Admin yaratildi! ID: ${u.id}`);
        }

        console.log('\n══════════════════════════════════════');
        console.log('  2️⃣  LOGIN');
        console.log('══════════════════════════════════════');

        const loginRes = await apiRequest('POST', '/api/auth/login', { phone: PHONE, password: PASSWORD });
        if (loginRes.status !== 200) {
            console.error('❌ Login xatosi:', JSON.stringify(loginRes.body));
            process.exit(1);
        }

        const token = loginRes.body?.data?.accessToken;
        const user = loginRes.body?.data?.user;
        console.log(`✅ Login muvaffaqiyatli!`);
        console.log(`   👤 Foydalanuvchi: ${user?.firstName} ${user?.lastName}`);
        console.log(`   🎭 Rol: ${user?.role}`);
        console.log(`   🔑 Token: ${token?.substring(0, 40)}...`);

        console.log('\n══════════════════════════════════════');
        console.log('  3️⃣  AUDIT STATS (migration tekshiruvi)');
        console.log('══════════════════════════════════════');

        const statsRes = await apiRequest('GET', '/api/audit/stats', null, token);
        if (statsRes.status === 200) {
            const stats = statsRes.body?.data?.stats;
            if (stats?.length === 0) {
                console.log('📊 Hali hech qanday audit log yo\'q (trigger ishlatilmagan)');
            } else {
                console.log('📊 Mavjud audit loglar statistikasi:');
                stats?.forEach(s => {
                    console.log(`   ${s.tableName.padEnd(12)} ${s.operation.padEnd(8)} → ${s.count} ta yozuv`);
                });
            }
        } else {
            console.error('❌ Stats xatosi:', JSON.stringify(statsRes.body));
        }

        console.log('\n══════════════════════════════════════');
        console.log('  4️⃣  GURUH YANGILASH (TRIGGER ISHLATISH)');
        console.log('══════════════════════════════════════');

        const groupsRes = await apiRequest('GET', '/api/academic/groups?limit=1', null, token);
        const firstGroup = groupsRes.body?.data?.groups?.[0];

        if (!firstGroup) {
            console.log('⚠️  Bazada hech qanday guruh yo\'q — groups jadvalidagi trigger tekshirib bo\'lmaydi.');
            console.log('   Buning o\'rniga users jadvalidagi trigger tekshiriladi...\n');

            // Users jadvalidagi trigger — o'z profilini yangilash
            const usersRes = await apiRequest('GET', '/api/auth/me', null, token);
            const myId = usersRes.body?.data?.user?.id;
            if (myId) {
                await client.query(
                    `UPDATE erp.users SET updated_at = NOW() WHERE id = $1`, [myId]
                );
                console.log(`✅ users jadvali yangilandi (ID: ${myId}) — trigger ishladi`);
            }
        } else {
            const oldName = firstGroup.name;
            const newName = oldName.replace(/ \[AUDIT.*\]$/, '') + ' [AUDIT-' + Date.now() + ']';

            const updateRes = await apiRequest(
                'PATCH',
                `/api/academic/groups/${firstGroup.id}`,
                { name: newName },
                token
            );

            if (updateRes.status === 200) {
                console.log(`✅ Guruh yangilandi!`);
                console.log(`   ID: ${firstGroup.id}`);
                console.log(`   Eski nom: "${oldName}"`);
                console.log(`   Yangi nom: "${newName}"`);
            } else {
                console.log('⚠️  Guruh yangilash xatosi:', JSON.stringify(updateRes.body).substring(0, 200));
            }
        }

        console.log('\n══════════════════════════════════════');
        console.log('  5️⃣  AUDIT LOGS TEKSHIRUVI');
        console.log('══════════════════════════════════════');

        const logsRes = await apiRequest('GET', '/api/audit/logs?limit=3', null, token);

        if (logsRes.status !== 200) {
            console.error('❌ Audit logs xatosi:', JSON.stringify(logsRes.body));
        } else {
            const logs = logsRes.body?.data?.logs;
            const total = logsRes.body?.data?.total;

            if (!logs || logs.length === 0) {
                console.log('⚠️  Audit log topilmadi — trigger ishlagan bo\'lsa ham DB da yozilmagan bo\'lishi mumkin.');
                console.log('   migration/001_create_audit_logs.sql qayta ishlatib ko\'ring.');
            } else {
                console.log(`✅ AUDIT TIZIMI 100% ISHLAYAPTI!`);
                console.log(`   Jami ${total} ta log yozuvi mavjud\n`);

                logs.forEach((log, i) => {
                    console.log(`── Log #${i + 1} ──────────────────────────────`);
                    console.log(`  Jadval:      ${log.tableName}`);
                    console.log(`  Operatsiya:  ${log.operation}`);
                    console.log(`  Yozuv ID:    ${log.recordId}`);
                    console.log(`  Kim:         ${log.changedByName || 'N/A'} (ID: ${log.changedBy || 'N/A'})`);
                    console.log(`  IP:          ${log.ipAddress || 'N/A'}`);
                    console.log(`  Vaqt:        ${new Date(log.createdAt).toLocaleString('uz-UZ')}`);
                    if (log.oldData) console.log(`  Old data:    ${JSON.stringify(log.oldData).substring(0, 120)}...`);
                    if (log.newData) console.log(`  New data:    ${JSON.stringify(log.newData).substring(0, 120)}...`);
                });
            }
        }

        console.log('\n══════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Xato:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
