import { query } from '../config/database';
import { UserSession } from '../domain/entities/user.entity';
import { ISessionRepository } from '../domain/interfaces/repository.interface';

// ============================================================
// SESSION REPOSITORY — Refresh token boshqaruvi
// ============================================================

function mapRowToSession(row: Record<string, unknown>): UserSession {
    return {
        id: row.id as number,
        userId: row.user_id as number,
        refreshToken: row.refresh_token as string,
        ipAddress: row.ip_address as string | null,
        userAgent: row.user_agent as string | null,
        expiresAt: new Date(row.expires_at as string),
        createdAt: new Date(row.created_at as string),
    };
}

export class SessionRepository implements ISessionRepository {
    async create(data: {
        userId: number;
        refreshToken: string;
        ipAddress: string | null;
        userAgent: string | null;
        expiresAt: Date;
    }): Promise<UserSession> {
        const rows = await query<Record<string, unknown>>(
            `INSERT INTO user_sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [data.userId, data.refreshToken, data.ipAddress, data.userAgent, data.expiresAt]
        );
        return mapRowToSession(rows[0]);
    }

    async findByToken(refreshToken: string): Promise<UserSession | null> {
        const rows = await query<Record<string, unknown>>(
            `SELECT * FROM user_sessions
       WHERE refresh_token = $1
         AND deleted_at IS NULL
         AND expires_at > NOW()`,
            [refreshToken]
        );
        return rows.length ? mapRowToSession(rows[0]) : null;
    }

    async deleteByToken(refreshToken: string): Promise<void> {
        await query(
            `UPDATE user_sessions SET deleted_at = NOW() WHERE refresh_token = $1`,
            [refreshToken]
        );
    }

    async deleteAllByUserId(userId: number): Promise<void> {
        await query(
            `UPDATE user_sessions SET deleted_at = NOW()
       WHERE user_id = $1 AND deleted_at IS NULL`,
            [userId]
        );
    }

    // Muddati o'tgan sessiyalarni tozalash (cron job uchun)
    async deleteExpired(): Promise<void> {
        await query(
            `UPDATE user_sessions SET deleted_at = NOW()
       WHERE expires_at < NOW() AND deleted_at IS NULL`
        );
    }
}
