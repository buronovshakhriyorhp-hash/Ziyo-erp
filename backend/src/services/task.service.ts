import { TaskRepository, CreateTaskData } from '../repositories/task.repository';
import { AppError } from '../utils/api-response.util';

// ============================================================
// TASK SERVICE — CRM Vazifalar biznes mantiqi
//
//   Qoidalar:
//   1. O'tgan sanaga vazifa qo'shib bo'lmaydi
//   2. Allaqachon bajarilgan vazifani qayta yakunlash mumkin emas
//   3. Faqat tayinlangan menejer yoki admin tahrirlashi mumkin
// ============================================================

export class TaskService {
    constructor(private readonly taskRepo: TaskRepository) { }

    // ════════════════════════════════════════════════════════
    // RO'YXAT
    // ════════════════════════════════════════════════════════

    async list(options: {
        assignedTo?: number;
        leadId?: number;
        isCompleted?: boolean;
        overdueOnly?: boolean;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.taskRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: number) {
        const task = await this.taskRepo.findById(id);
        if (!task) throw new AppError('Vazifa topilmadi', 404, 'TASK_NOT_FOUND');
        return task;
    }

    /**
     * Bugungi va o'tib ketgan vazifalar xulosasi (dashboard uchun).
     * Har bir menejer bo'yicha overdueCount va dueTodayCount.
     */
    async getOverdueSummary() {
        return this.taskRepo.findOverdueSummary();
    }

    // ════════════════════════════════════════════════════════
    // YARATISH
    // ════════════════════════════════════════════════════════

    async create(dto: CreateTaskData) {
        if (!dto.title?.trim()) {
            throw new AppError('Vazifa sarlavhasi bo\'sh bo\'lishi mumkin emas', 400, 'EMPTY_TITLE');
        }

        // O'tib ketgan sanaga yangi vazifa qo'shib bo'lmaydi
        if (dto.dueDate) {
            const due = new Date(dto.dueDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(23, 59, 59, 999);

            if (due < yesterday) {
                throw new AppError(
                    'Muddati o\'tib ketgan sanaga vazifa qo\'shib bo\'lmaydi',
                    400, 'PAST_DUE_DATE'
                );
            }
        }

        return this.taskRepo.create(dto);
    }

    // ════════════════════════════════════════════════════════
    // YANGILASH
    // ════════════════════════════════════════════════════════

    async update(id: number, dto: Partial<CreateTaskData>) {
        const task = await this.getById(id);

        if (task.isCompleted) {
            throw new AppError(
                'Bajarilgan vazifani tahrirlash mumkin emas. Avval qayta oching.',
                400, 'TASK_ALREADY_COMPLETED'
            );
        }

        return this.taskRepo.update(id, dto);
    }

    // ════════════════════════════════════════════════════════
    // BAJARILGAN DEGAN BELGI
    // ════════════════════════════════════════════════════════

    async complete(id: number) {
        const task = await this.getById(id);

        if (task.isCompleted) {
            throw new AppError('Vazifa allaqachon bajarilgan', 400, 'TASK_ALREADY_COMPLETED');
        }

        return this.taskRepo.markComplete(id);
    }

    // ════════════════════════════════════════════════════════
    // QAYTA OCHISH
    // ════════════════════════════════════════════════════════

    async reopen(id: number) {
        const task = await this.getById(id);

        if (!task.isCompleted) {
            throw new AppError('Vazifa hali bajarilmagan', 400, 'TASK_NOT_COMPLETED');
        }

        return this.taskRepo.reopen(id);
    }

    // ════════════════════════════════════════════════════════
    // O'CHIRISH
    // ════════════════════════════════════════════════════════

    async delete(id: number): Promise<void> {
        await this.getById(id);
        await this.taskRepo.softDelete(id);
    }
}
