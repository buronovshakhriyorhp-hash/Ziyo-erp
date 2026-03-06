import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendSuccess, AppError } from '../utils/api-response.util';
import { socketService } from '../services/socket.service';

// ============================================================
// PAYMENT CONTROLLER
//
//  Marshrutlar (finance.routes.ts da):
//   GET  /payments               — ro'yxat
//   GET  /payments/:id           — bitta to'lov
//   POST /payments               — to'lov qabul qilish (PAYMENT_WRITE)
//   DELETE /payments/:id         — bekor qilish (ADMIN_ONLY)
//
//   GET  /students/:id/balance   — talaba balansi
//   GET  /debts                  — qarzlar ro'yxati
//   POST /debts/mark-overdue     — muddati o'tganlarni belgilash (ADMIN_ONLY)
// ============================================================

export class PaymentController {
    constructor(private readonly paymentSvc: PaymentService) { }

    // ── To'lovlar ──────────────────────────────────────────────

    /** GET /api/finance/payments?studentId=&groupId=&fromDate=&toDate=&page=&limit= */
    list = async (req: Request, res: Response): Promise<void> => {
        const result = await this.paymentSvc.list({
            studentId: req.query.studentId ? parseInt(req.query.studentId as string) : undefined,
            groupId: req.query.groupId ? parseInt(req.query.groupId as string) : undefined,
            fromDate: req.query.fromDate as string | undefined,
            toDate: req.query.toDate as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'To\'lovlar ro\'yxati');
    };

    /** GET /api/finance/payments/:id */
    getOne = async (req: Request, res: Response): Promise<void> => {
        const payment = await this.paymentSvc.getById(parseInt(req.params.id));
        sendSuccess(res, payment, 'To\'lov ma\'lumotlari');
    };

    /**
     * POST /api/finance/payments
     *
     * Body: {
     *   enrollmentId, studentId, paymentMethodId,
     *   amount, paymentMonth (YYYY-MM-01),
     *   paymentDate? (YYYY-MM-DD, default: bugun),
     *   description?, receiptNumber?
     * }
     *
     * Atomik tranzaksiya:
     *   → payments jadvaliga INSERT
     *   → payment_debts.amount_paid yangilanadi
     *   → Response-da balanceAfter (yangilangan balans) qaytariladi
     *
     * Xavfsizlik: faqat PAYMENT_WRITE rollarga ruxsat (admin, manager)
     */
    makePayment = async (req: Request, res: Response): Promise<void> => {
        const {
            enrollmentId, studentId, paymentMethodId,
            amount, paymentMonth, paymentDate,
            description, receiptNumber,
        } = req.body;

        if (!enrollmentId || !studentId || !amount || !paymentMonth || !paymentMethodId) {
            throw new AppError(
                'enrollmentId, studentId, paymentMethodId, amount va paymentMonth majburiy',
                400, 'MISSING_FIELDS'
            );
        }

        const result = await this.paymentSvc.makePayment({
            enrollmentId: parseInt(enrollmentId),
            studentId: parseInt(studentId),
            paymentMethodId: parseInt(paymentMethodId),
            receivedBy: req.user!.sub,   // JWT dan kassir/admin ID
            amount: parseFloat(amount),
            paymentMonth,
            paymentDate,
            description: description ?? null,
            receiptNumber: receiptNumber ?? null,
            reqContext: {
                managerId: req.user!.sub,
                managerName: (req.user as any).firstName ? `${(req.user as any).firstName} ${(req.user as any).lastName}` : `Foydalanuvchi (${(req.user as any).roleName})`,
                ip: req.ip || req.connection.remoteAddress || 'unknown',
                ua: req.headers['user-agent'] || 'unknown',
            }
        });

        // Barcha ulangan UI klentlarga jonli xabar jo'natamiz
        socketService.emitEvent('PAYMENT_RECEIVED', result);

        sendSuccess(res, result, result.message, 201);
    };

    /**
     * DELETE /api/finance/payments/:id
     *
     * Faqat bugungi to'lovni bekor qilish mumkin.
     * Qarz payment_debts.amount_paid orqaga qaytariladi.
     * Faqat ADMIN_ONLY.
     */
    cancel = async (req: Request, res: Response): Promise<void> => {
        await this.paymentSvc.cancelPayment(parseInt(req.params.id));
        sendSuccess(res, null, 'To\'lov bekor qilindi va qarz tiklandi');
    };

    // ── Balans ─────────────────────────────────────────────────

    /**
     * GET /api/finance/students/:studentId/balance
     *
     * Returns: { totalPaid, totalDebt, balance }
     *   balance = totalPaid - totalDebt (qolgan joriy qarzlar)
     */
    getBalance = async (req: Request, res: Response): Promise<void> => {
        const balance = await this.paymentSvc.getStudentBalance(
            parseInt(req.params.studentId)
        );
        sendSuccess(res, balance, 'Talaba balansi');
    };

    // ── Qarzlar ────────────────────────────────────────────────

    /**
     * GET /api/finance/debts?studentId=&enrollmentId=&status=&overdueOnly=&page=&limit=
     *
     * status: pending | partial | paid | overdue | cancelled
     * overdueOnly=true  →  faqat muddati o'tganlar
     */
    listDebts = async (req: Request, res: Response): Promise<void> => {
        const result = await this.paymentSvc.listDebts({
            studentId: req.query.studentId ? parseInt(req.query.studentId as string) : undefined,
            enrollmentId: req.query.enrollmentId ? parseInt(req.query.enrollmentId as string) : undefined,
            status: req.query.status as string | undefined,
            overdueOnly: req.query.overdueOnly === 'true',
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Qarzlar ro\'yxati');
    };

    /**
     * POST /api/finance/debts/mark-overdue
     *
     * Muddati o'tgan qarzlarni 'overdue' ga o'tkazadi.
     * Odatda cron yoki admin so'rovida ishlatiladi.
     * Qaytaradi: { updated: N }
     */
    markOverdue = async (req: Request, res: Response): Promise<void> => {
        const result = await this.paymentSvc.markOverdueDebts();
        sendSuccess(res, result,
            `${result.updated} ta qarz 'overdue' holatiga o'tkazildi`
        );
    };
}
