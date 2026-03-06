import { PaymentRepository, CreatePaymentData } from '../repositories/payment.repository';
import { AppError } from '../utils/api-response.util';
import { telegramService } from './telegram.service';

// ============================================================
// PAYMENT SERVICE  —  To'lov biznes mantiqi
//
//  Asosiy qoidalar:
//   1. amount > 0 bo'lishi shart
//   2. paymentMonth format YYYY-MM-DD  (oyning 1-kuni)
//   3. Enrollment mavjud bo'lishi kerak
//   4. Tranzaksiya: payments INSERT + payment_debts UPDATE atomik
//   5. Muddati o'tgan (overdue) qarzlarni avtomatik belgilash
//   6. Balans sinxronizatsiyasi — to'lovdan avval/keyin balansni qaytarish
// ============================================================

// ─── Tiplar ───────────────────────────────────────────────────

export interface MakePaymentDto {
    enrollmentId: number;
    studentId: number;
    paymentMethodId: number;
    receivedBy: number;   // Kassir/admin user ID
    amount: number;
    paymentDate?: string;   // YYYY-MM-DD (default: bugun)
    paymentMonth: string;   // YYYY-MM-01
    description?: string | null;
    receiptNumber?: string | null;
    reqContext?: {          // Audit Trigger uchun meta information
        managerId: number;
        managerName: string;
        ip: string;
        ua: string;
    };
}

export interface MakePaymentResult {
    payment: ReturnType<PaymentRepository['findById']> extends Promise<infer T> ? T : never;
    debtUpdated: boolean;
    balanceAfter: {
        totalPaid: number;
        totalDebt: number;
        balance: number;
    };
    message: string;
}

// ─── Helper ───────────────────────────────────────────────────
function isValidDate(d: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

// ══════════════════════════════════════════════════════════════

export class PaymentService {
    constructor(private readonly paymentRepo: PaymentRepository) { }

    // ════════════════════════════════════════════════════════
    // RO'YXAT
    // ════════════════════════════════════════════════════════

    async list(options: {
        studentId?: number;
        groupId?: number;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.paymentRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: number) {
        const payment = await this.paymentRepo.findById(id);
        if (!payment) throw new AppError('To\'lov topilmadi', 404, 'PAYMENT_NOT_FOUND');
        return payment;
    }

    // ════════════════════════════════════════════════════════
    // BALANS  —  Talabaning moliyaviy holati
    //
    //   balance = SUM(payments.amount)
    //           - SUM(payment_debts.amount_due - amount_paid)
    //             WHERE status IN ('pending','partial','overdue')
    //
    //  Bu metod enrollment.service.ts da skipBalanceCheck
    //  o'rniga ishlatiladi.
    // ════════════════════════════════════════════════════════

    async getStudentBalance(studentId: number) {
        return this.paymentRepo.getStudentBalance(studentId);
    }

    // ════════════════════════════════════════════════════════
    // TO'LOV QILISH  —  Atomik tranzaksiya
    //
    //  Steps (ichki):
    //   1. Validatsiya (summa, sana, format)
    //   2. payments jadvaliga INSERT
    //   3. payment_debts.amount_paid += amount (FOR UPDATE lock)
    //   4. status yangilanadi: pending→partial/paid
    //   5. Balans qaytariladi (balanceAfter)
    // ════════════════════════════════════════════════════════

    async makePayment(dto: MakePaymentDto) {
        // ── Validatsiya ────────────────────────────────────────
        if (!dto.amount || dto.amount <= 0) {
            throw new AppError(
                'To\'lov summasi 0 dan katta bo\'lishi kerak',
                400, 'INVALID_AMOUNT'
            );
        }

        if (dto.amount > 100_000_000) {
            throw new AppError(
                'Bir to\'lov summasi 100,000,000 so\'mdan oshmasligi kerak',
                400, 'AMOUNT_TOO_LARGE'
            );
        }

        if (!isValidDate(dto.paymentMonth)) {
            throw new AppError(
                'paymentMonth formati: YYYY-MM-01 (masalan: 2026-03-01)',
                400, 'INVALID_PAYMENT_MONTH'
            );
        }

        // paymentMonth doimo oyning 1-kuni bo'lishi kerak
        const pmDay = new Date(dto.paymentMonth).getDate();
        if (pmDay !== 1) {
            throw new AppError(
                `paymentMonth oyning 1-kuni bo'lishi kerak (masalan: 2026-03-01). Siz ${dto.paymentMonth} berdingiz.`,
                400, 'INVALID_PAYMENT_MONTH_DAY'
            );
        }

        if (dto.paymentDate && !isValidDate(dto.paymentDate)) {
            throw new AppError(
                'paymentDate formati: YYYY-MM-DD',
                400, 'INVALID_PAYMENT_DATE'
            );
        }

        // Kelajak sanaga to'lov taqiqlanadi (bugundan > 1 kun)
        if (dto.paymentDate) {
            const pd = new Date(dto.paymentDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (pd > now) {
                throw new AppError(
                    'Kelajak sanasiga to\'lov qilib bo\'lmaydi',
                    400, 'FUTURE_PAYMENT_DATE'
                );
            }
        }

        if (!dto.reqContext) {
            throw new AppError('Audit ma\'lumotlari (reqContext) yetishmayapti', 400);
        }

        // ── Tranzaksion yaratish ───────────────────────────────
        const data: CreatePaymentData = {
            enrollmentId: dto.enrollmentId,
            studentId: dto.studentId,
            paymentMethodId: dto.paymentMethodId,
            receivedBy: dto.receivedBy,
            amount: dto.amount,
            paymentDate: dto.paymentDate,
            paymentMonth: dto.paymentMonth,
            description: dto.description ?? null,
            receiptNumber: dto.receiptNumber ?? null,
        };

        const { payment, debtUpdated } = await this.paymentRepo.createWithCascadingDebtUpdate(
            data,
            dto.reqContext
        );

        // ── To'lovdan keyin balansni hisoblash ─────────────────
        const balanceAfter = await this.paymentRepo.getStudentBalance(dto.studentId);

        // Notify via Telegram
        void telegramService.notifyPayment({
            studentName: dto.reqContext?.managerName || 'Talaba',
            amount: dto.amount,
            type: dto.paymentMethodId === 1 ? 'Naqd' : 'Karta'
        });

        return {
            payment,
            debtUpdated,
            balanceAfter,
            message: debtUpdated
                ? `To'lov qabul qilindi va ${dto.paymentMonth.slice(0, 7)} uchun qarz yangilandi`
                : 'To\'lov qabul qilindi (ushbu oy uchun qarz topilmadi)',
        };
    }

    // ════════════════════════════════════════════════════════
    // QARZLAR RO'YXATI
    // ════════════════════════════════════════════════════════

    async listDebts(options: {
        studentId?: number;
        enrollmentId?: number;
        status?: string;
        overdueOnly?: boolean;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.paymentRepo.findDebts({ ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    // ════════════════════════════════════════════════════════
    // MUDDATI O'TGAN QARZLARNI BELGILASH
    //
    //  Har kecha cron yoki admin so'rovida ishlatiladi.
    //  due_date < TODAY AND status IN ('pending','partial') → 'overdue'
    // ════════════════════════════════════════════════════════

    async markOverdueDebts(): Promise<{ updated: number }> {
        return this.paymentRepo.markOverdueDebts();
    }

    // ════════════════════════════════════════════════════════
    // TO'LOVNI BEKOR QILISH
    //
    //  Biznes qoidasi: faqat bugungi to'lovni bekor qilish mumkin.
    //  Qarz yangilanadi (amount_paid qaytariladi).
    // ════════════════════════════════════════════════════════

    async cancelPayment(id: number): Promise<void> {
        const payment = await this.getById(id);

        const paymentDate = new Date(payment.paymentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        paymentDate.setHours(0, 0, 0, 0);

        if (paymentDate < today) {
            throw new AppError(
                'O\'tgan kunlardagi to\'lovlarni bekor qilib bo\'lmaydi',
                400, 'CANNOT_CANCEL_PAST_PAYMENT'
            );
        }

        await this.paymentRepo.cancelPaymentWithDebtRollback(id);
    }
}
