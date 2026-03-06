import { Request, Response } from 'express';
import { LeadService } from '../services/lead.service';
import { sendSuccess, AppError } from '../utils/api-response.util';
import { socketService } from '../services/socket.service';

export class LeadController {
    constructor(private readonly leadSvc: LeadService) { }

    // GET /api/crm/leads?statusId=&assignedTo=&search=&page=&limit=
    list = async (req: Request, res: Response): Promise<void> => {
        const result = await this.leadSvc.list({
            statusId: req.query.statusId ? parseInt(req.query.statusId as string) : undefined,
            assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined,
            search: req.query.search as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Lidlar ro\'yxati');
    };

    // GET /api/crm/leads/:id
    getOne = async (req: Request, res: Response): Promise<void> => {
        const lead = await this.leadSvc.getById(parseInt(req.params.id));
        sendSuccess(res, lead, 'Lid ma\'lumotlari');
    };

    // POST /api/crm/leads
    create = async (req: Request, res: Response): Promise<void> => {
        const lead = await this.leadSvc.create(req.body);

        // Yangi lid tushganda barcha adminlarga jonli xabar
        socketService.emitEvent('NEW_LEAD', lead);

        sendSuccess(res, lead, 'Yangi lid qo\'shildi', 201);
    };

    // PATCH /api/crm/leads/:id
    // ⚡ Status "Yozildi" ga o'zgarsa — avtomatik konversiya boshlanadi
    update = async (req: Request, res: Response): Promise<void> => {
        const reqContext = {
            managerId: req.user!.sub,
            managerName: 'Menejer (Auto)',
            ip: req.ip || '',
            ua: req.headers['user-agent'] || '',
        };
        const result = await this.leadSvc.update(
            parseInt(req.params.id),
            req.body,
            reqContext
        );
        sendSuccess(res, result, 'Lid ma\'lumotlari yangilandi');
    };

    /**
     * POST /api/crm/leads/:id/convert
     * Lidni qo'lda talabaga aylantirish.
     *
     * ⚡ ATOMIC TRANSACTION:
     *   → users jadvalida talaba yaratiladi (role = 'student')
     *   → student_profiles yaratiladi
     *   → leads.student_id va converted_at yangilanadi
     *   → call_log yoziladi (joriy menejer nomi bilan)
     *
     * Body (ixtiyoriy): { birthDate?, address?, schoolName?, grade? }
     * ⚠️ Javobda tempPassword qaytariladi — SMS/email orqali talabaga yuboring!
     */
    convertToStudent = async (req: Request, res: Response): Promise<void> => {
        const leadId = parseInt(req.params.id);
        const reqContext = {
            managerId: req.user!.sub,
            managerName: 'Menejer (Auto)',
            ip: req.ip || '',
            ua: req.headers['user-agent'] || '',
        };

        const result = await this.leadSvc.convertToStudent(leadId, reqContext, req.body);

        sendSuccess(
            res,
            result,
            `Lid muvaffaqiyatli talabaga aylantirildi! ` +
            `⚠️ Vaqtinchalik parolni talabaga yuboring: ${result.tempPassword}`,
            201
        );
    };

    // POST /api/crm/leads/:id/calls
    addCall = async (req: Request, res: Response): Promise<void> => {
        const leadId = parseInt(req.params.id);
        const calledBy = req.user!.sub;   // Har doim joriy foydalanuvchi
        const callLog = await this.leadSvc.addCallLog({ ...req.body, leadId, calledBy });
        sendSuccess(res, callLog, 'Qo\'ng\'iroq tarixi saqlandi', 201);
    };

    // GET /api/crm/leads/:id/calls
    getCalls = async (req: Request, res: Response): Promise<void> => {
        const calls = await this.leadSvc.getCallHistory(parseInt(req.params.id));
        sendSuccess(res, calls, 'Qo\'ng\'iroqlar tarixi');
    };

    // DELETE /api/crm/leads/:id
    delete = async (req: Request, res: Response): Promise<void> => {
        await this.leadSvc.delete(parseInt(req.params.id));
        sendSuccess(res, null, 'Lid o\'chirildi');
    };

    // ════════════════════════════════════════════════════════
    // GLOBAL CALL LOGS (Dashboard uchun)
    // ════════════════════════════════════════════════════════

    /**
     * GET /api/crm/call-logs
     * Barcha qo'ng'iroqlar ro'yxati — filter va pagination bilan.
     * Query: calledBy, leadId, fromDate, toDate, page, limit
     */
    listAllCalls = async (req: Request, res: Response): Promise<void> => {
        const result = await this.leadSvc.listAllCallLogs({
            calledBy: req.query.calledBy ? parseInt(req.query.calledBy as string) : undefined,
            leadId: req.query.leadId ? parseInt(req.query.leadId as string) : undefined,
            fromDate: req.query.fromDate as string | undefined,
            toDate: req.query.toDate as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Barcha qo\'ng\'iroqlar');
    };

    /**
     * GET /api/crm/call-logs/upcoming
     * Kelajakda rejalashtirilgan qo'ng'iroqlar (next_call_at bo'yicha).
     * Menejer eslatmasi uchun.
     * Query: calledBy (ixtiyoriy — faqat o'z eslatmalari uchun)
     */
    upcomingCalls = async (req: Request, res: Response): Promise<void> => {
        // calledBy berilmasa — admin barcha eslatmalarni ko'radi
        const calledBy = req.query.calledBy
            ? parseInt(req.query.calledBy as string)
            : undefined;

        const data = await this.leadSvc.getUpcomingReminders(calledBy);
        sendSuccess(res, data, `Rejalashtirilgan qo'ng'iroqlar (${data.length} ta)`);
    };

    /**
     * DELETE /api/crm/call-logs/:callId
     * Qo'ng'iroq logini o'chirish (soft delete).
     */
    deleteCall = async (req: Request, res: Response): Promise<void> => {
        const callLogId = parseInt(req.params.callId);
        if (isNaN(callLogId)) {
            throw new AppError('Noto\'g\'ri callId', 400, 'INVALID_CALL_ID');
        }
        await this.leadSvc.deleteCallLog(callLogId);
        sendSuccess(res, null, 'Qo\'ng\'iroq logi o\'chirildi');
    };
}
