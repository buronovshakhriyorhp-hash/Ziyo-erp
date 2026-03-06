import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/api-response.util';

// ============================================================
// ANALYTICS CONTROLLER
// ============================================================

export class AnalyticsController {
    constructor(private readonly svc: AnalyticsService) { }

    // ────────────────────────────────────────────────────────
    // GET /api/analytics/financial?month=2026-03
    //
    // Javob: { totalRevenue, totalExpenses, netProfit,
    //          profitMargin, collectionRate, pendingDebt,
    //          revenueBreakdown[], expenseBreakdown[] }
    // ────────────────────────────────────────────────────────
    financialSummary = async (req: Request, res: Response): Promise<void> => {
        const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
        const data = await this.svc.getFinancialSummary(month);
        sendSuccess(res, data, 'Moliyaviy xulosa');
    };

    // ────────────────────────────────────────────────────────
    // GET /api/analytics/students?courseId=
    //
    // Javob: kurs bo'yicha { activeCount, churnRate, avgAttendance, ... }[]
    // ────────────────────────────────────────────────────────
    studentStats = async (req: Request, res: Response): Promise<void> => {
        const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
        const data = await this.svc.getStudentStats(courseId);
        sendSuccess(res, data, 'Talabalar statistikasi');
    };

    // ────────────────────────────────────────────────────────
    // GET /api/analytics/teachers?month=2026-03
    // ────────────────────────────────────────────────────────
    teacherPerformance = async (req: Request, res: Response): Promise<void> => {
        const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
        const data = await this.svc.getTeacherPerformance(month);
        sendSuccess(res, data, 'O\'qituvchilar samaradorligi');
    };

    // ────────────────────────────────────────────────────────
    // GET /api/analytics/trends?months=6
    // ────────────────────────────────────────────────────────
    monthlyTrends = async (req: Request, res: Response): Promise<void> => {
        const months = req.query.months ? parseInt(req.query.months as string) : 6;
        const data = await this.svc.getMonthlyTrends(months);
        sendSuccess(res, data, `So\'nggi ${months} oy trendi`);
    };

    // ════════════════════════════════════════════════════════
    // EXPORT ENDPOINTS
    // ════════════════════════════════════════════════════════

    /**
     * GET /api/analytics/export/debtors?format=excel|pdf&minDebt=0
     *
     * Excel → application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     * PDF   → application/pdf
     */
    exportDebtors = async (req: Request, res: Response): Promise<void> => {
        const format = (req.query.format as string)?.toLowerCase() ?? 'excel';
        const minDebt = req.query.minDebt ? parseFloat(req.query.minDebt as string) : 0;
        const date = new Date().toISOString().split('T')[0];

        if (format === 'pdf') {
            const buf = await this.svc.exportDebtorsToPDF(minDebt);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="qarzdorlar-${date}.pdf"`);
            res.setHeader('Content-Length', buf.length);
            res.send(buf);
        } else {
            const buf = await this.svc.exportDebtorsToExcel(minDebt);
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader('Content-Disposition', `attachment; filename="qarzdorlar-${date}.xlsx"`);
            res.setHeader('Content-Length', buf.length);
            res.send(buf);
        }
    };

    /**
     * GET /api/analytics/export/monthly?month=2026-03&format=excel
     *
     * Oylik moliyaviy hisobot (2 varaqli Excel):
     *   1. Moliyaviy Xulosa
     *   2. To'lovlar jadvali (har bir talaba)
     */
    exportMonthlyReport = async (req: Request, res: Response): Promise<void> => {
        const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
        const buf = await this.svc.exportMonthlyReportToExcel(month);
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="hisobot-${month}.xlsx"`
        );
        res.setHeader('Content-Length', buf.length);
        res.send(buf);
    };
}
