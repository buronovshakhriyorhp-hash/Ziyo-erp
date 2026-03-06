import { SalaryRepository } from '../repositories/salary.repository';
import { AppError } from '../utils/api-response.util';

// ============================================================
// SALARY SERVICE — O'qituvchi maoshi biznes mantiqi
//
//   Ish jarayoni:
//   1. calculate()  → status: 'calculated'
//   2. approve()    → status: 'approved'  (Admin)
//   3. markPaid()   → status: 'paid'      (Admin)
// ============================================================

export class SalaryService {
    constructor(private readonly salaryRepo: SalaryRepository) { }

    // RO'YXAT
    async list(options: {
        teacherId?: number;
        status?: string;
        year?: number;
        month?: number;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.salaryRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: number) {
        const sal = await this.salaryRepo.findById(id);
        if (!sal) throw new AppError('Maosh davri topilmadi', 404, 'SALARY_NOT_FOUND');
        return sal;
    }

    // ============================================================
    // SETTINGS
    // ============================================================

    async getSettings(teacherId: number) {
        return this.salaryRepo.getSettings(teacherId);
    }

    async updateSettings(data: {
        teacherId: number;
        salaryMode: 'fixed' | 'per_lesson' | 'percentage' | 'calculated';
        amount: number;
        kpiRate: number;
    }) {
        return this.salaryRepo.updateSettings(data);
    }

    // ════════════════════════════════════════════════════════
    // MAOSHNI AVTOMATIK HISOBLASH
    //
    // Formula:
    //   1. DB dan base_salary va kpi_rate olinadi
    //   2. Darslar va davomat hisoblanadi
    //   3. kpi_bonus = base_salary * kpi_rate% * attendance_rate%
    //   4. total_salary = base_salary + kpi_bonus - deductions
    // ════════════════════════════════════════════════════════

    async calculate(
        teacherId: number,
        periodMonth: string,   // 'YYYY-MM-01'
        deductions?: number,
        notes?: string
    ) {
        // periodMonth formati tekshiruvi
        if (!/^\d{4}-\d{2}-01$/.test(periodMonth)) {
            throw new AppError(
                'periodMonth formati: YYYY-MM-01 (masalan: 2026-03-01)',
                400, 'INVALID_PERIOD_MONTH'
            );
        }

        // Kelajakdagi oy uchun hisoblash mumkin emas
        const period = new Date(periodMonth);
        const now = new Date();
        now.setDate(1); now.setHours(0, 0, 0, 0);
        if (period > now) {
            throw new AppError(
                'Kelajakdagi oy uchun maosh hisoblab bo\'lmaydi',
                400, 'FUTURE_PERIOD'
            );
        }

        return this.salaryRepo.calculateAndSave(
            teacherId, periodMonth, deductions ?? 0, notes
        );
    }

    // ════════════════════════════════════════════════════════
    // TASDIQLASH (Admin)
    // ════════════════════════════════════════════════════════

    async approve(id: number, approvedBy: number) {
        const sal = await this.getById(id);

        if (sal.status !== 'calculated') {
            throw new AppError(
                `"${sal.status}" holatidagi maoshni tasdiqlash mumkin emas`,
                400, 'INVALID_SALARY_STATUS'
            );
        }

        return this.salaryRepo.approve(id, approvedBy);
    }

    // ════════════════════════════════════════════════════════
    // TO'LANGAN DEGAN BELGI (Admin)
    // ════════════════════════════════════════════════════════

    async markPaid(id: number, paymentMethodId?: number) {
        const sal = await this.getById(id);

        if (sal.status !== 'approved') {
            throw new AppError(
                'Faqat tasdiqlangan maoshni to\'langan deb belgilash mumkin',
                400, 'SALARY_NOT_APPROVED'
            );
        }

        return this.salaryRepo.markPaid(id, paymentMethodId);
    }

    // O'CHIRISH (faqat 'calculated' holatida)
    async delete(id: number): Promise<void> {
        const sal = await this.getById(id);

        if (sal.status !== 'calculated') {
            throw new AppError(
                'Faqat "calculated" holatidagi maosh yozuvini o\'chirish mumkin',
                400, 'CANNOT_DELETE_SALARY'
            );
        }
        await this.salaryRepo.softDelete(id);
    }
}
