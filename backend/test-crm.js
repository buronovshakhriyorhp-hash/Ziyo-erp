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

function apiRequest(method, urlPath, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: urlPath,
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

async function runTest() {
    let token = '';
    console.log('1. Logging in as Admin...');
    const loginRes = await apiRequest('POST', '/api/auth/login', { phone: PHONE, password: PASSWORD });
    if (loginRes.status !== 200) {
        console.error('Login Failed:', loginRes.body);
        process.exit(1);
    }
    token = loginRes.body.data.accessToken;
    console.log('✅ Logged in successfully');

    console.log('\n2. Creating a new test Lead...');
    const rndPhone = '+998' + Math.floor(100000000 + Math.random() * 900000000);
    const newLeadRes = await apiRequest('POST', '/api/crm/leads', {
        fullName: 'Test Lead Auto',
        phone: rndPhone,
        statusId: 1 // 1: 'Yangi' usually
    }, token);

    if (newLeadRes.status !== 201) {
        console.error('Failed to create Lead:', newLeadRes.body);
        process.exit(1);
    }
    const leadId = newLeadRes.body.data.id;
    console.log(`✅ Lead created with ID: ${leadId}`);

    console.log('\n3. Converting the Lead (Update Status to Yozildi - usually ID 5 or via /convert directly)...');
    // Using direct /convert endpoint
    const convertRes = await apiRequest('POST', `/api/crm/leads/${leadId}/convert`, {
        birthDate: '2005-01-01',
        address: 'Toshkent',
    }, token);

    if (convertRes.status !== 201) {
        console.error('Failed to convert Lead:', convertRes.body);
    } else {
        const studentData = convertRes.body.data;
        console.log(`✅ Converted to Student! User ID: ${studentData.userId}, Student Profile ID: ${studentData.studentId}`);
        console.log(`🔑 Temp Password generated: ${studentData.tempPassword}`);
    }

    console.log('\n4. Checking Call Logs for Auto-Conversion Log...');
    const callsRes = await apiRequest('GET', `/api/crm/leads/${leadId}/calls`, null, token);
    const logs = callsRes.body?.data || [];
    if (logs.length > 0) {
        console.log(`✅ Found call log: "${logs[0].notes}"`);
    } else {
        console.error('❌ Call log not created for conversion!');
    }

    console.log('\n✅ Testing completed successfully!');
    process.exit(0);
}

runTest();
