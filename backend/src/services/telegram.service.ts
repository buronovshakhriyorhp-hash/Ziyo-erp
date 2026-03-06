import * as https from 'https';
import { query } from '../config/database';
import { logger } from '../utils/logger.util';

export class TelegramService {
    private botToken: string = '';
    private chatId: string = '';

    constructor() {
        void this.loadSettings();
    }

    private async loadSettings() {
        try {
            const settings = await query(
                `SELECT key, value FROM system_settings 
                 WHERE key IN ('telegram_bot_token', 'telegram_chat_id')`
            );

            settings.forEach((s: any) => {
                if (s.key === 'telegram_bot_token') this.botToken = s.value;
                if (s.key === 'telegram_chat_id') this.chatId = s.value;
            });

            if (this.botToken) logger.info('✅ Telegram Bot ulandi!');
            else logger.warn('TELEGRAM_BOT_TOKEN topilmadi — bot faolsiz');
        } catch {
            logger.warn('Telegram settings yuklashda xato — bot faolsiz');
        }
    }

    /** Token va chatId ni dastur ichida yangilash (admin UI bilan mos) */
    reloadSettings(): void {
        void this.loadSettings();
    }

    async sendMessage(message: string, targetChatId?: string): Promise<boolean> {
        const chat = targetChatId || this.chatId;
        if (!this.botToken || !chat) return false;

        return new Promise((resolve) => {
            const data = JSON.stringify({
                chat_id: chat,
                text: message,
                parse_mode: 'HTML'
            });

            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${this.botToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = https.request(options, (res) => {
                resolve(res.statusCode === 200);
            });

            req.on('error', () => resolve(false));
            req.write(data);
            req.end();
        });
    }

    /** Yangi lid haqida xabar */
    async notifyNewLead(lead: { fullName: string; phone: string; courseInterest?: string | null }) {
        const text = `<b>🆕 YANGI LID!</b>\n\n` +
            `👤 <b>Ism:</b> ${lead.fullName}\n` +
            `📞 <b>Tel:</b> ${lead.phone}\n` +
            (lead.courseInterest ? `📚 <b>Kurs:</b> ${lead.courseInterest}\n` : '') +
            `⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}\n\n` +
            `<i>CRM orqali bog'lanishni unutmang!</i>`;
        return this.sendMessage(text);
    }

    /** To'lov qilinganda xabar */
    async notifyPayment(payment: { studentName: string; amount: number; type: string }) {
        const text = `<b>💰 YANGI TO'LOV!</b>\n\n` +
            `👤 <b>Talaba:</b> ${payment.studentName}\n` +
            `💸 <b>Summa:</b> ${payment.amount.toLocaleString()} UZS\n` +
            `💳 <b>Turi:</b> ${payment.type}\n` +
            `⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}\n\n` +
            `✅ <i>Tizimga muvaffaqiyatli saqlandi.</i>`;
        return this.sendMessage(text);
    }

    /** To'lov eslatmasi — muddati kelgan qarzlar uchun */
    async sendPaymentReminder(opts: {
        chatId: string;
        studentName: string;
        courseName: string;
        amountDue: number;
        dueMonth: string;
    }): Promise<void> {
        const text = `⚠️ <b>To'lov Eslatmasi</b>\n\n` +
            `Hurmatli ota-ona!\n\n` +
            `📚 Kurs: <b>${opts.courseName}</b>\n` +
            `👤 Talaba: <b>${opts.studentName}</b>\n` +
            `💰 Summa: <b>${opts.amountDue.toLocaleString()} so'm</b>\n` +
            `📅 Oy: <b>${opts.dueMonth}</b>\n\n` +
            `Iltimos, to'lovni o'z vaqtida amalga oshiring.`;
        await this.sendMessage(text, opts.chatId);
    }

    /** Davomat bildirishi — talaba kelmadi */
    async sendAbsenceNotification(opts: {
        chatId: string;
        studentName: string;
        groupName: string;
        lessonDate: string;
        teacherName: string;
    }): Promise<void> {
        const text = `❌ <b>Davomat Bildirishi</b>\n\n` +
            `<b>${opts.studentName}</b> bugun darsga kelmadi!\n\n` +
            `📚 Guruh: <b>${opts.groupName}</b>\n` +
            `📅 Sana: <b>${opts.lessonDate}</b>\n` +
            `👨‍🏫 O'qituvchi: <b>${opts.teacherName}</b>`;
        await this.sendMessage(text, opts.chatId);
    }

    /** Oylik hisobot — admin uchun */
    async sendMonthlyReport(opts: {
        month: string;
        totalRevenue: number;
        totalStudents: number;
        newStudents: number;
        collectionRate: number;
    }): Promise<void> {
        const text = `📊 <b>Oylik Hisobot — ${opts.month}</b>\n\n` +
            `💰 Daromad: <b>${opts.totalRevenue.toLocaleString()} so'm</b>\n` +
            `👥 Talabalar: <b>${opts.totalStudents} ta</b>\n` +
            `🆕 Yangilar: <b>${opts.newStudents} ta</b>\n` +
            `📈 Yig'uv: <b>${opts.collectionRate}%</b>`;
        await this.sendMessage(text);
    }
}

export const telegramService = new TelegramService();
