import { LessonRepository, CreateLessonData, LessonStatus } from '../repositories/lesson.repository';
import { AppError } from '../utils/api-response.util';

// ============================================================
// LESSON SERVICE — Dars jadvali biznes mantiqi
//
// Asosiy funksiya: Room va Teacher COLLISION DETECTION
// ============================================================

export class LessonService {
    constructor(private readonly lessonRepo: LessonRepository) { }

    // RO'YXAT
    async list(opts: {
        groupId?: number;
        roomId?: number;
        teacherId?: number;
        date?: string;
        fromDate?: string;
        toDate?: string;
        status?: LessonStatus;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 30, ...rest } = opts;
        const offset = (page - 1) * limit;
        const { data, total } = await this.lessonRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: number) {
        const lesson = await this.lessonRepo.findById(id);
        if (!lesson) throw new AppError('Dars topilmadi', 404, 'LESSON_NOT_FOUND');
        return lesson;
    }

    async getTodaySchedule(teacherId?: number) {
        return this.lessonRepo.getTodaySchedule(teacherId);
    }

    // ════════════════════════════════════════════════════════
    // 🚨 XONA CONFLICT TEKSHIRUVI (Standalone)
    //
    // Frontend "xona band?" deb so'raganda ishlatiladi.
    // ════════════════════════════════════════════════════════

    async checkRoomAvailability(opts: {
        roomId: number;
        lessonDate: string;
        startTime: string;
        endTime: string;
        excludeLessonId?: number;
    }) {
        this._validateTime(opts.startTime, opts.endTime);
        const conflicts = await this.lessonRepo.checkRoomConflict(opts);
        return {
            available: conflicts.length === 0,
            conflicts,
        };
    }

    // ════════════════════════════════════════════════════════
    // YARATISH — Ikki qadam:
    //   1. Xona va o'qituvchi conflict tekshiruvi
    //   2. Darsni saqlash
    // ════════════════════════════════════════════════════════

    async create(data: CreateLessonData & { teacherId: number }) {
        this._validateTime(data.startTime, data.endTime);
        this._validateDate(data.lessonDate);

        // Xona conflict
        if (data.roomId) {
            const roomConflicts = await this.lessonRepo.checkRoomConflict({
                roomId: data.roomId,
                lessonDate: data.lessonDate,
                startTime: data.startTime,
                endTime: data.endTime,
            });
            if (roomConflicts.length) {
                throw new AppError(
                    `Xona ${data.lessonDate} kuni ${roomConflicts[0].startTime}–${roomConflicts[0].endTime} oralig'ida band: "${roomConflicts[0].conflictingGroup}" guruhi`,
                    409, 'ROOM_CONFLICT'
                );
            }
        }

        // O'qituvchi conflict
        const teacherConflicts = await this.lessonRepo.checkTeacherConflict({
            teacherId: data.teacherId,
            lessonDate: data.lessonDate,
            startTime: data.startTime,
            endTime: data.endTime,
        });
        if (teacherConflicts.length) {
            throw new AppError(
                `O'qituvchi ${data.lessonDate} kuni ${teacherConflicts[0].startTime}–${teacherConflicts[0].endTime} oralig'ida band: "${teacherConflicts[0].conflictingGroup}" guruhi`,
                409, 'TEACHER_CONFLICT'
            );
        }

        return this.lessonRepo.create(data);
    }

    // ════════════════════════════════════════════════════════
    // YANGILASH — Conflict qayta tekshiriladi
    // ════════════════════════════════════════════════════════

    async update(id: number, data: Partial<CreateLessonData> & { teacherId?: number }) {
        const existing = await this.getById(id);
        if (existing.status === 'completed') {
            throw new AppError('Bajarilgan darsni tahrirlash mumkin emas', 400, 'LESSON_COMPLETED');
        }
        if (existing.status === 'cancelled') {
            throw new AppError('Bekor qilingan darsni tahrirlash mumkin emas', 400, 'LESSON_CANCELLED');
        }

        // Yangi vaqt va xona bilan conflict tekshiruvi
        const checkStart = data.startTime ?? existing.startTime;
        const checkEnd = data.endTime ?? existing.endTime;
        const checkDate = data.lessonDate ?? existing.lessonDate;
        const checkRoom = data.roomId ?? existing.roomId ?? undefined;

        if (data.startTime || data.endTime) {
            this._validateTime(checkStart, checkEnd);
        }

        if (checkRoom && (data.roomId || data.lessonDate || data.startTime || data.endTime)) {
            const roomConflicts = await this.lessonRepo.checkRoomConflict({
                roomId: checkRoom,
                lessonDate: checkDate,
                startTime: checkStart,
                endTime: checkEnd,
                excludeLessonId: id,
            });
            if (roomConflicts.length) {
                throw new AppError(
                    `Xona ${checkDate} kuni ${roomConflicts[0].startTime}–${roomConflicts[0].endTime} band: "${roomConflicts[0].conflictingGroup}"`,
                    409, 'ROOM_CONFLICT'
                );
            }
        }

        return this.lessonRepo.update(id, data);
    }

    // BEKOR QILISH
    async cancel(id: number, reason: string) {
        const lesson = await this.getById(id);
        if (lesson.status === 'completed') {
            throw new AppError('Bajarilgan darsni bekor qilib bo\'lmaydi', 400, 'LESSON_COMPLETED');
        }
        if (!reason?.trim()) {
            throw new AppError('Bekor qilish sababi ko\'rsatilishi shart', 400, 'REASON_REQUIRED');
        }
        return this.lessonRepo.cancel(id, reason);
    }

    // O'CHIRISH
    async delete(id: number): Promise<void> {
        await this.getById(id);
        await this.lessonRepo.softDelete(id);
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE
    // ════════════════════════════════════════════════════════

    private _validateTime(start: string, end: string) {
        if (start >= end) {
            throw new AppError(
                `Boshlanish vaqti (${start}) tugash vaqtidan (${end}) katta yoki teng bo'lishi mumkin emas`,
                400, 'INVALID_TIME_RANGE'
            );
        }
    }

    private _validateDate(date: string) {
        const lesson = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Faqat 7 kundan eski sanalarga cheklov
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (lesson < weekAgo) {
            throw new AppError(
                'Bir haftadan eski sanaga dars qo\'shib bo\'lmaydi',
                400, 'DATE_TOO_OLD'
            );
        }
    }
}
