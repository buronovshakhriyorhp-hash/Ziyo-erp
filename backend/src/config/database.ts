import { Pool, PoolConfig } from 'pg';
import { ENV } from './env';
import { logger } from '../utils/logger.util';

// ============================================================
// PostgreSQL Connection Pool
// ============================================================
const poolConfig: PoolConfig = {
    host: ENV.DB.HOST,
    port: ENV.DB.PORT,
    database: ENV.DB.NAME,
    user: ENV.DB.USER,
    password: ENV.DB.PASSWORD,
    max: ENV.DB.POOL_MAX,
    idleTimeoutMillis: ENV.DB.IDLE_MS,
    connectionTimeoutMillis: 5000,
    // SSL ni production muhitida yoqish
    ssl: ENV.IS_PRODUCTION ? { rejectUnauthorized: true } : false,
};

export const pool = new Pool(poolConfig);

// Ulanish xatolarini tinglash
pool.on('error', (err) => {
    logger.error('PostgreSQL pool xatosi:', err);
});

// Ma'lumotlar bazasiga ulanishni tekshirish
export async function connectDatabase(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        logger.info('✅ PostgreSQL ulanish muvaffaqiyatli');
    } finally {
        client.release();
    }
}

// Schema'ni o'rnatish (search_path = erp)
export async function query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
): Promise<T[]> {
    const client = await pool.connect();
    try {
        await client.query('SET search_path = erp');
        const result = await client.query(sql, params);
        return result.rows as T[];
    } finally {
        client.release();
    }
}

// Tranzaksiya uchun yordamchi
export async function withTransaction<T>(
    fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SET search_path = erp');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================
// AUDIT CONTEXT — Trigger uchun session variableslarni o'rnatish
// ============================================================
/**
 * Tranzaksiya ichida kimligini va HTTP meta'ni triggerga uzatadi.
 * PostgreSQL trigger funksiyasi current_setting() orqali o'qiydi.
 *
 * @param userId   - req.user.sub (JWT dan)
 * @param userName - Ism Familiya (snapshot)
 * @param ip       - req.ip
 * @param ua       - req.headers['user-agent']
 * @param fn       - Asosiy tranzaksiya funksiyasi
 */
export async function withAuditContext<T>(
    userId: number | null,
    userName: string | null,
    ip: string | null,
    ua: string | null,
    fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SET search_path = erp');

        // Session variableslarni o'rnatish (faqat shu tranzaksiya uchun)
        await client.query(`SET LOCAL app.current_user_id   = '${userId ?? ''}'`);
        await client.query(`SET LOCAL app.current_user_name = '${(userName ?? '').replace(/'/g, "''")}'`);
        await client.query(`SET LOCAL app.current_ip        = '${(ip ?? '').replace(/'/g, "''")}'`);
        await client.query(`SET LOCAL app.current_ua        = '${(ua ?? '').replace(/'/g, "''")}'`);

        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
