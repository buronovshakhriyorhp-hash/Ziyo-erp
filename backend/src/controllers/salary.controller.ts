import { Request, Response } from 'express';
import { SalaryService } from '../services/salary.service';
import { sendSuccess } from '../utils/api-response.util';

export class SalaryController {
    constructor(private readonly salarySvc: SalaryService) { }

    // GET /api/finance/salaries?teacherId=&status=&year=&month=&page=&limit=
    list = async (req: Request, res: Response): Promise<void> => {
        const {
            teacherId,
            status,
            year,
            month,
            page,
            limit,
        } = req.query;

        const parsedPage = page ? Number(page) : 1;
        const parsedLimit = limit ? Number(limit) : 20;

        const result = await this.salarySvc.list({
            teacherId: teacherId ? Number(teacherId) : undefined,
            status: typeof status === 'string' ? status : undefined,
            year: year ? Number(year) : undefined,
            month: month ? Number(month) : undefined,
            page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
            limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20,
        });
        sendSuccess(res, result, 'Maoshlar ro\'yxati');
    };

    // GET /api/finance/salaries/settings/:teacherId
    getSettings = async (req: Request, res: Response): Promise<void> => {
        const teacherId = Number(req.params.teacherId);
        const settings = await this.salarySvc.getSettings(teacherId);
        sendSuccess(res, settings, 'Oylik sozlamalari');
    };

    // POST /api/finance/salaries/settings
    updateSettings = async (req: Request, res: Response): Promise<void> => {
        const {
            teacherId,
            salaryMode,
            amount,
            kpiRate,
        } = req.body;

        const result = await this.salarySvc.updateSettings({
            teacherId: Number(teacherId),
            salaryMode,
            amount: Number(amount),
            kpiRate: kpiRate ? Number(kpiRate) : 0,
        });
        sendSuccess(res, result, 'Oylik sozlamalari yangilandi');
    };

    // GET /api/finance/salaries/:id
    getOne = async (req: Request, res: Response): Promise<void> => {
        const sal = await this.salarySvc.getById(parseInt(req.params.id));
        sendSuccess(res, sal, 'Maosh ma\'lumotlari');
    };

    /**
     * POST /api/finance/salaries/calculate
     *
     * Body: { teacherId, periodMonth, deductions?, notes? }
     *
     * Bir tranzaksiyada:
     *   1. Darslar sonini DB dan hisoblaydi
     *   2. Davomat %ini hisoblaydi
     *   3. KPI bonus = base_salary * kpi_rate% * attendance%
     *   4. teacher_salary_periods ga yozadi (yoki yangilaydi)
     */
    calculate = async (req: Request, res: Response): Promise<void> => {
        const { teacherId, periodMonth, deductions, notes } = req.body;
        const result = await this.salarySvc.calculate(
            parseInt(teacherId), periodMonth,
            deductions ? parseFloat(deductions) : 0,
            notes
        );
        sendSuccess(res, result, 'Maosh muvaffaqiyatli hisoblandi', 201);
    };

    /**
     * PATCH /api/finance/salaries/:id/approve
     * Admin maoshni tasdiqlaydi → status: 'approved'
     */
    approve = async (req: Request, res: Response): Promise<void> => {
        const approvedBy = req.user!.sub;
        const result = await this.salarySvc.approve(parseInt(req.params.id), approvedBy);
        sendSuccess(res, result, 'Maosh tasdiqlandi');
    };

    /**
     * PATCH /api/finance/salaries/:id/mark-paid
     * Body: { paymentMethodId? }
     * Admin to'lov amalga oshirilganini belgilaydi → status: 'paid'
     */
    markPaid = async (req: Request, res: Response): Promise<void> => {
        const { paymentMethodId } = req.body;
        const result = await this.salarySvc.markPaid(
            parseInt(req.params.id),
            paymentMethodId ? parseInt(paymentMethodId) : undefined
        );
        sendSuccess(res, result, 'Maosh to\'langan deb belgilandi');
    };

    // DELETE /api/finance/salaries/:id  — faqat 'calculated' holatida
    delete = async (req: Request, res: Response): Promise<void> => {
        await this.salarySvc.delete(parseInt(req.params.id));
        sendSuccess(res, null, 'Maosh yozuvi o\'chirildi');
    };
}
