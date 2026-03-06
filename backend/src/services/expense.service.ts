import { ExpenseRepository, CreateExpenseData } from '../repositories/expense.repository';
import { AppError } from '../utils/api-response.util';

// ============================================================
// EXPENSE SERVICE — Xarajatlar biznes mantiqi
// ============================================================

export class ExpenseService {
    constructor(private readonly expenseRepo: ExpenseRepository) { }

    // RO'YXAT
    async list(options: {
        categoryId?: number;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.expenseRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: number) {
        const expense = await this.expenseRepo.findById(id);
        if (!expense) throw new AppError('Xarajat topilmadi', 404, 'EXPENSE_NOT_FOUND');
        return expense;
    }

    async listCategories() {
        return this.expenseRepo.listCategories();
    }

    // Davr bo'yicha xarajat xulosasi (moliya paneli uchun)
    async getSummary(fromDate: string, toDate: string) {
        this._validateDateRange(fromDate, toDate);
        const rows = await this.expenseRepo.getSummaryByCategory(fromDate, toDate);
        const grandTotal = rows.reduce((s, r) => s + Number(r.total), 0);
        return { byCategory: rows, grandTotal };
    }

    // YARATISH
    async create(dto: CreateExpenseData) {
        if (dto.amount <= 0) {
            throw new AppError('Xarajat summasi 0 dan katta bo\'lishi kerak', 400, 'INVALID_AMOUNT');
        }
        return this.expenseRepo.create(dto);
    }

    // YANGILASH
    async update(id: number, dto: Partial<CreateExpenseData>) {
        await this.getById(id);
        if (dto.amount !== undefined && dto.amount <= 0) {
            throw new AppError('Xarajat summasi 0 dan katta bo\'lishi kerak', 400, 'INVALID_AMOUNT');
        }
        return this.expenseRepo.update(id, dto);
    }

    // O'CHIRISH
    async delete(id: number): Promise<void> {
        await this.getById(id);
        await this.expenseRepo.softDelete(id);
    }

    // PRIVATE
    private _validateDateRange(from: string, to: string) {
        if (new Date(from) > new Date(to)) {
            throw new AppError('Boshlanish sanasi tugash sanasidan katta', 400, 'INVALID_DATE_RANGE');
        }
    }
}
