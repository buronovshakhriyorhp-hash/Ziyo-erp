import { query, withTransaction } from '../config/database';

// ============================================================
// BOT USER REPOSITORY
// bot_users, bot_registrations, announcements jadvallari
// ============================================================

export interface BotUser {
    id: number;
    telegramId: number;
    username?: string;
    firstName: string;
    lastName?: string;
    language: 'uz' | 'ru';
    notificationsEnabled: boolean;
    studentId?: number;
    createdAt: Date;
}

export interface BotRegistration {
    id: number;
    telegramId: number;
    fullName: string;
    phone: string;
    courseId?: number;
    courseName?: string;
    status: 'pending' | 'contacted' | 'enrolled' | 'rejected';
    notes?: string;
    createdAt: Date;
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    sentCount: number;
    createdAt: Date;
}

export class BotUserRepository {

    // ─── BOT USERS ────────────────────────────────────────────

    async upsertUser(data: {
        telegramId: number;
        username?: string;
        firstName: string;
        lastName?: string;
    }): Promise<BotUser> {
        const rows = await query<BotUser>(
            `INSERT INTO bot_users (telegram_id, username, first_name, last_name)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (telegram_id) DO UPDATE SET
               username   = EXCLUDED.username,
               first_name = EXCLUDED.first_name,
               last_name  = EXCLUDED.last_name,
               updated_at = NOW()
             RETURNING *`,
            [data.telegramId, data.username || null, data.firstName, data.lastName || null]
        );
        return this._mapUser(rows[0]);
    }

    async findByTelegramId(telegramId: number): Promise<BotUser | null> {
        const rows = await query<any>(
            `SELECT * FROM bot_users WHERE telegram_id = $1`,
            [telegramId]
        );
        return rows[0] ? this._mapUser(rows[0]) : null;
    }

    async updateLanguage(telegramId: number, language: 'uz' | 'ru'): Promise<void> {
        await query(
            `UPDATE bot_users SET language = $1 WHERE telegram_id = $2`,
            [language, telegramId]
        );
    }

    async toggleNotifications(telegramId: number): Promise<boolean> {
        const rows = await query<{ notifications_enabled: boolean }>(
            `UPDATE bot_users
             SET notifications_enabled = NOT notifications_enabled
             WHERE telegram_id = $1
             RETURNING notifications_enabled`,
            [telegramId]
        );
        return rows[0]?.notifications_enabled ?? false;
    }

    async getAllSubscribers(): Promise<{ telegramId: number; language: 'uz' | 'ru' }[]> {
        const rows = await query<{ telegram_id: number; language: string }>(
            `SELECT telegram_id, language FROM bot_users WHERE notifications_enabled = true`
        );
        return rows.map(r => ({ telegramId: r.telegram_id, language: r.language as 'uz' | 'ru' }));
    }

    async linkToStudent(telegramId: number, studentId: number): Promise<void> {
        await query(
            `UPDATE bot_users SET student_id = $1 WHERE telegram_id = $2`,
            [studentId, telegramId]
        );
    }

    async getTotalUsers(): Promise<number> {
        const rows = await query<{ count: string }>(`SELECT COUNT(*) FROM bot_users`);
        return parseInt(rows[0]?.count || '0');
    }

    // ─── REGISTRATIONS ────────────────────────────────────────

    async createRegistration(data: {
        telegramId: number;
        fullName: string;
        phone: string;
        courseId?: number;
        courseName?: string;
    }): Promise<BotRegistration> {
        const rows = await query<any>(
            `INSERT INTO bot_registrations
               (telegram_id, full_name, phone, course_id, course_name, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             RETURNING *`,
            [data.telegramId, data.fullName, data.phone, data.courseId || null, data.courseName || null]
        );
        return this._mapRegistration(rows[0]);
    }

    async getPendingRegistrations(): Promise<BotRegistration[]> {
        const rows = await query<any>(
            `SELECT * FROM bot_registrations WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50`
        );
        return rows.map(r => this._mapRegistration(r));
    }

    async updateRegistrationStatus(id: number, status: BotRegistration['status'], notes?: string): Promise<void> {
        await query(
            `UPDATE bot_registrations SET status = $1, notes = $2 WHERE id = $3`,
            [status, notes || null, id]
        );
    }

    async getTodayRegistrations(): Promise<number> {
        const rows = await query<{ count: string }>(
            `SELECT COUNT(*) FROM bot_registrations WHERE created_at::date = CURRENT_DATE`
        );
        return parseInt(rows[0]?.count || '0');
    }

    // ─── ANNOUNCEMENTS ────────────────────────────────────────

    async createAnnouncement(data: { title: string; content: string; sentCount: number }): Promise<Announcement> {
        const rows = await query<any>(
            `INSERT INTO announcements (title, content, sent_count)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [data.title, data.content, data.sentCount]
        );
        return this._mapAnnouncement(rows[0]);
    }

    async getRecentAnnouncements(limit = 10): Promise<Announcement[]> {
        const rows = await query<any>(
            `SELECT * FROM announcements ORDER BY created_at DESC LIMIT $1`,
            [limit]
        );
        return rows.map(r => this._mapAnnouncement(r));
    }

    // ─── MAPPERS ─────────────────────────────────────────────

    private _mapUser(row: any): BotUser {
        return {
            id: row.id,
            telegramId: row.telegram_id,
            username: row.username,
            firstName: row.first_name,
            lastName: row.last_name,
            language: row.language || 'uz',
            notificationsEnabled: row.notifications_enabled,
            studentId: row.student_id,
            createdAt: row.created_at,
        };
    }

    private _mapRegistration(row: any): BotRegistration {
        return {
            id: row.id,
            telegramId: row.telegram_id,
            fullName: row.full_name,
            phone: row.phone,
            courseId: row.course_id,
            courseName: row.course_name,
            status: row.status,
            notes: row.notes,
            createdAt: row.created_at,
        };
    }

    private _mapAnnouncement(row: any): Announcement {
        return {
            id: row.id,
            title: row.title,
            content: row.content,
            sentCount: row.sent_count,
            createdAt: row.created_at,
        };
    }
}

export const botUserRepository = new BotUserRepository();
