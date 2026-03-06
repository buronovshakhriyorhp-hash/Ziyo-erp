const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'ziyo_erp',
    password: '123',
    port: 5432,
});

async function run() {
    await client.connect();
    const res = await client.query(`SELECT phone, role_name FROM erp.users WHERE role_name IN ('student', 'parent') LIMIT 10`);
    console.log(res.rows);
    await client.end();
}
run();
