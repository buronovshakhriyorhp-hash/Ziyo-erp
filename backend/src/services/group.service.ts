import { GroupRepository, CreateGroupData, GroupStatus } from '../repositories/group.repository';
import { AppError } from '../utils/api-response.util';

// ============================================================
// GROUP SERVICE
// Mas'uliyat: Guruh ochish, yangilash, o'chirish biznes mantiqi.
//
//   Asosiy murakkab qoidalar:
//   1. CONFLICT DETECTION — o'qituvchi yoki xona boshqa guruhda
//      shu vaqt va kunda band bo'lmasligi kerak
//   2. Dars vaqtlari to'g'ri bo'lishi (startTime < endTime)
//   3. Kurs va o'qituvchi bazada mavjud bo'lishi
// ============================================================

export interface CreateGroupDto {
    courseId: number;
    teacherId: number;
    roomId?: number | null;
    dayComboId?: number | null;
    name: string;
    startTime: string;   // "HH:MM"
    endTime: string;   // "HH:MM"
    startDate: string;   // "YYYY-MM-DD"
    endDate?: string | null;
    maxStudents?: number;
}

export class GroupService {
    constructor(private readonly groupRepo: GroupRepository) { }

    // ════════════════════════════════════════════════════════
    // RO'YXAT
    // ════════════════════════════════════════════════════════

    async list(options: {
        courseId?: number;
        teacherId?: number;
        status?: GroupStatus;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.groupRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getById(id: number) {
        const group = await this.groupRepo.findById(id);
        if (!group) {
            throw new AppError('Guruh topilmadi', 404, 'GROUP_NOT_FOUND');
        }
        return group;
    }

    // ════════════════════════════════════════════════════════
    // YARATISH — CONFLICT DETECTION BILAN
    // ════════════════════════════════════════════════════════

    /**
     * Yangi guruh ochish.
     *
     * Tekshiruv tartibi:
     *  1. Vaqt to'g'riligi: startTime < endTime
     *  2. O'qituvchi konflikti — shu o'qituvchi shu vaqt/kun boshqa guruhda bo'lmasin
     *  3. Xona konflikti — shu xona shu vaqt/kun boshqa guruhda band bo'lmasin
     *
     * ⚠️ day_combination_id berilmasa days=[] bo'ladi, conflict bo'lmaydi.
     *    Real tizimda day_combination_id majburiy qilinishi tavsiya etiladi.
     */
    async create(dto: CreateGroupDto) {
        // 1. Vaqt to'g'riligi
        this._validateTimeRange(dto.startTime, dto.endTime);

        // 2. Conflict tekshiruvi uchun kunlarni olish kerak
        //    (day_combination_id → days massivini DB dan topamiz)
        const days = await this._getDays(dto.dayComboId ?? null);

        if (days.length > 0) {
            // 3. O'qituvchi konflikti
            const teacherConflict = await this.groupRepo.checkTeacherConflict({
                teacherId: dto.teacherId,
                startTime: dto.startTime,
                endTime: dto.endTime,
                days,
                roomId: dto.roomId ?? null,
            });

            if (teacherConflict.hasConflict) {
                const cg = teacherConflict.conflictGroup!;
                throw new AppError(
                    teacherConflict.conflictType === 'teacher'
                        ? `O'qituvchi bu vaqtda boshqa guruhda band: "${cg.name}" ` +
                        `(${cg.startTime} – ${cg.endTime})`
                        : `Xona bu vaqtda boshqa guruhda band: "${cg.name}" ` +
                        `(${cg.startTime} – ${cg.endTime})`,
                    409,
                    teacherConflict.conflictType === 'teacher'
                        ? 'TEACHER_SCHEDULE_CONFLICT'
                        : 'ROOM_SCHEDULE_CONFLICT'
                );
            }
        }

        // 4. Guruhni yaratish
        return this.groupRepo.create(dto);
    }

    // ════════════════════════════════════════════════════════
    // YANGILASH — CONFLICT DETECTION BILAN
    // ════════════════════════════════════════════════════════

    async update(id: number, dto: Partial<CreateGroupDto>) {
        const existing = await this.getById(id);

        // Yangi vaqt berilgan bo'lsa tekshiramiz
        const newStartTime = dto.startTime ?? existing.startTime;
        const newEndTime = dto.endTime ?? existing.endTime;
        const newTeacherId = dto.teacherId ?? existing.teacherId;
        const newRoomId = dto.roomId !== undefined ? dto.roomId : existing.roomId;
        const newDayComboId = dto.dayComboId !== undefined
            ? dto.dayComboId
            : existing.dayComboId;

        this._validateTimeRange(newStartTime, newEndTime);

        const days = await this._getDays(newDayComboId ?? null);
        if (days.length > 0) {
            const conflict = await this.groupRepo.checkTeacherConflict({
                teacherId: newTeacherId,
                startTime: newStartTime,
                endTime: newEndTime,
                days,
                excludeId: id,              // Eski guruhni hisobga olmaymiz
                roomId: newRoomId ?? null,
            });

            if (conflict.hasConflict) {
                const cg = conflict.conflictGroup!;
                throw new AppError(
                    conflict.conflictType === 'teacher'
                        ? `O'qituvchi bu vaqtda boshqa guruhda band: "${cg.name}"`
                        : `Xona bu vaqtda boshqa guruhda band: "${cg.name}"`,
                    409,
                    conflict.conflictType === 'teacher'
                        ? 'TEACHER_SCHEDULE_CONFLICT'
                        : 'ROOM_SCHEDULE_CONFLICT'
                );
            }
        }

        return this.groupRepo.update(id, dto);
    }

    // ════════════════════════════════════════════════════════
    // STATUS O'ZGARTIRISH
    // ════════════════════════════════════════════════════════

    async changeStatus(id: number, status: GroupStatus) {
        const group = await this.getById(id);

        // Biznes qoidasi: Tugallangan yoki bekor qilingan guruhni
        //                 qaytadan aktivlashtirish mumkin emas
        if (
            (group.status === 'completed' || group.status === 'cancelled') &&
            (status === 'recruiting' || status === 'active')
        ) {
            throw new AppError(
                `"${group.status}" holatidagi guruhni "${status}" ga o'tkazib bo'lmaydi`,
                400,
                'INVALID_STATUS_TRANSITION'
            );
        }

        return this.groupRepo.updateStatus(id, status);
    }

    // ════════════════════════════════════════════════════════
    // O'CHIRISH
    // ════════════════════════════════════════════════════════

    async delete(id: number): Promise<void> {
        const group = await this.getById(id);

        // Aktiv guruhni o'chirish mumkin emas — avval tugallansin/bekor qilinsin
        if (group.status === 'active') {
            throw new AppError(
                'Aktiv guruhni o\'chirib bo\'lmaydi. Avval statusini o\'zgartiring.',
                400,
                'CANNOT_DELETE_ACTIVE_GROUP'
            );
        }

        await this.groupRepo.softDelete(id);
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE YORDAMCHI METODLAR
    // ════════════════════════════════════════════════════════

    private _validateTimeRange(startTime: string, endTime: string): void {
        if (startTime >= endTime) {
            throw new AppError(
                `Dars boshlanish vaqti (${startTime}) tugash vaqtidan (${endTime}) kichik bo'lishi kerak`,
                400,
                'INVALID_TIME_RANGE'
            );
        }
    }

    /**
     * day_combination_id dan kunlar massivini olish.
     * NULL bo'lsa — bo'sh massiv qaytaradi (conflict tekshirilmaydi).
     */
    private async _getDays(dayComboId: number | null): Promise<string[]> {
        if (!dayComboId) return [];

        const { query: dbQuery } = await import('../config/database');
        const rows = await dbQuery<{ days: string[] }>(
            `SELECT days FROM day_combinations
             WHERE id = $1 AND deleted_at IS NULL`,
            [dayComboId]
        );
        return rows[0]?.days ?? [];
    }
}
