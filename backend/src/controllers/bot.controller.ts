import { Request, Response } from 'express';
import { sendBroadcast, notifyNewCourse } from '../bot/bot';
import { botUserRepository } from '../repositories/bot-user.repository';
import { sendSuccess, sendError } from '../utils/api-response.util';

// ============================================================
// BOT CONTROLLER — Admin API
// ============================================================

export class BotController {

    /** POST /api/bot/broadcast — Barcha obunachilarga xabar yuborish */
    async broadcast(req: Request, res: Response): Promise<void> {
        const { message, title } = req.body;
        if (!message) {
            sendError(res, 'message maydoni talab qilinadi', 400, 'MISSING_MESSAGE');
            return;
        }
        const text = title ? `📢 <b>${title}</b>\n\n${message}` : message;
        const sent = await sendBroadcast(text);
        sendSuccess(res, { sentCount: sent }, `Xabar ${sent} ta foydalanuvchiga yuborildi`);
    }

    /** POST /api/bot/new-course — Yangi kurs e'loni */
    async announceNewCourse(req: Request, res: Response): Promise<void> {
        const { courseName } = req.body;
        if (!courseName) {
            sendError(res, 'courseName talab qilinadi', 400, 'MISSING_COURSE_NAME');
            return;
        }
        await notifyNewCourse(courseName);
        sendSuccess(res, {}, `"${courseName}" kursi haqida e'lon yuborildi`);
    }

    /** GET /api/bot/registrations — Kursga yozilish so'rovlari */
    async getRegistrations(req: Request, res: Response): Promise<void> {
        const regs = await botUserRepository.getPendingRegistrations();
        sendSuccess(res, regs);
    }

    /** PATCH /api/bot/registrations/:id — So'rov holatini o'zgartirish */
    async updateRegistration(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const { status, notes } = req.body;
        const validStatuses = ['pending', 'contacted', 'enrolled', 'rejected'];
        if (!validStatuses.includes(status)) {
            sendError(res, 'Noto\'g\'ri status', 400, 'INVALID_STATUS');
            return;
        }
        await botUserRepository.updateRegistrationStatus(id, status, notes);
        sendSuccess(res, {}, 'Status yangilandi');
    }

    /** GET /api/bot/announcements — E'lonlar tarixi */
    async getAnnouncements(req: Request, res: Response): Promise<void> {
        const limit = parseInt(String(req.query.limit || '20'));
        const announcements = await botUserRepository.getRecentAnnouncements(limit);
        sendSuccess(res, announcements);
    }

    /** GET /api/bot/stats — Bot statistikasi */
    async getStats(req: Request, res: Response): Promise<void> {
        const [totalUsers, todayReg] = await Promise.all([
            botUserRepository.getTotalUsers(),
            botUserRepository.getTodayRegistrations(),
        ]);
        sendSuccess(res, { totalUsers, todayRegistrations: todayReg });
    }
}

export const botController = new BotController();
