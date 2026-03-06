// ============================================================
// BOT STATE SERVICE
// Foydalanuvchi sessiyalarini in-memory saqlaydi
// Multi-step formalar uchun zarur (ro'yxatdan o'tish, fikr-mulohaza)
// ============================================================

export type BotAction =
    | 'idle'
    | 'registration_name'
    | 'registration_phone'
    | 'registration_course'
    | 'feedback_rating'
    | 'feedback_comment'
    | 'certificate_name'
    | 'contact_admin'
    | 'broadcast_admin';

export interface UserSession {
    chatId: number;
    action: BotAction;
    language: 'uz' | 'ru';
    data: Record<string, string | number>;
    lastActivity: Date;
}

class BotStateService {
    private sessions = new Map<number, UserSession>();

    get(chatId: number): UserSession {
        if (!this.sessions.has(chatId)) {
            this.sessions.set(chatId, {
                chatId,
                action: 'idle',
                language: 'uz',
                data: {},
                lastActivity: new Date(),
            });
        }
        const session = this.sessions.get(chatId)!;
        session.lastActivity = new Date();
        return session;
    }

    setAction(chatId: number, action: BotAction): void {
        const session = this.get(chatId);
        session.action = action;
        if (action === 'idle') session.data = {};
    }

    setData(chatId: number, key: string, value: string | number): void {
        const session = this.get(chatId);
        session.data[key] = value;
    }

    setLanguage(chatId: number, lang: 'uz' | 'ru'): void {
        const session = this.get(chatId);
        session.language = lang;
    }

    reset(chatId: number): void {
        const session = this.get(chatId);
        session.action = 'idle';
        session.data = {};
    }

    /** Eski sessiyalarni 1 soatdan keyin tozalaydi */
    cleanupOldSessions(): void {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        this.sessions.forEach((session, chatId) => {
            if (session.lastActivity < oneHourAgo) {
                this.sessions.delete(chatId);
            }
        });
    }
}

export const botState = new BotStateService();

// Har soatda eski sessiyalarni tozalash
setInterval(() => botState.cleanupOldSessions(), 60 * 60 * 1000);
