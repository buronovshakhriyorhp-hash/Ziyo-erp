import { CourseRepository, CreateCourseData, CourseLevel } from '../repositories/course.repository';
import { AppError } from '../utils/api-response.util';

// ============================================================
// COURSE SERVICE
// Mas'uliyat: Kurslar biznes mantiqi.
//
//   Qoidalar:
//   1. Aktiv guruhi bor kursni o'chirib bo'lmaydi
//   2. Narx manfiy bo'lmasligi kerak
//   3. Dars davomiyligi mantiqi (minutes > 0)
// ============================================================

export interface CreateCourseDto {
    subjectId: number;
    name: string;
    description?: string | null;
    durationMonths?: number;       // standart: 1
    lessonsPerWeek?: number;       // standart: 3
    lessonDurationMin?: number;       // standart: 90
    pricePerMonth: number;
    level?: CourseLevel;  // standart: 'beginner'
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {
    isActive?: boolean;
}

export class CourseService {
    constructor(private readonly courseRepo: CourseRepository) { }

    // ════════════════════════════════════════════════════════
    // RO'YXAT
    // ════════════════════════════════════════════════════════

    async list(options: {
        subjectId?: number;
        isActive?: boolean;
        level?: CourseLevel;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.courseRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: number) {
        const course = await this.courseRepo.findById(id);
        if (!course) throw new AppError('Kurs topilmadi', 404, 'COURSE_NOT_FOUND');
        return course;
    }

    async listSubjects() {
        return this.courseRepo.listSubjects();
    }

    // ════════════════════════════════════════════════════════
    // YARATISH
    // ════════════════════════════════════════════════════════

    async create(dto: CreateCourseDto) {
        this._validateDto(dto);
        return this.courseRepo.create(dto);
    }

    // ════════════════════════════════════════════════════════
    // YANGILASH
    // ════════════════════════════════════════════════════════

    async update(id: number, dto: UpdateCourseDto) {
        await this.getById(id); // mavjudligi

        if (dto.pricePerMonth !== undefined) this._validatePrice(dto.pricePerMonth);
        if (dto.lessonDurationMin !== undefined) this._validateDuration(dto.lessonDurationMin);
        if (dto.lessonsPerWeek !== undefined) this._validateLessonsPerWeek(dto.lessonsPerWeek);

        return this.courseRepo.update(id, dto);
    }

    // ════════════════════════════════════════════════════════
    // FAOLLIK HOLATI O'ZGARTIRISH
    // ════════════════════════════════════════════════════════

    async toggleActive(id: number) {
        const course = await this.getById(id);
        return this.courseRepo.update(id, { isActive: !course.isActive });
    }

    // ════════════════════════════════════════════════════════
    // O'CHIRISH
    // ════════════════════════════════════════════════════════

    async delete(id: number): Promise<void> {
        const course = await this.getById(id);

        // Aktiv guruhi bor kursni o'chirish mumkin emas
        if (course.activeGroups > 0) {
            throw new AppError(
                `Bu kursda ${course.activeGroups} ta aktiv guruh mavjud. ` +
                `Guruhlarni yoping, keyin kursni o'chiring.`,
                400,
                'COURSE_HAS_ACTIVE_GROUPS'
            );
        }

        await this.courseRepo.softDelete(id);
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE
    // ════════════════════════════════════════════════════════

    private _validateDto(dto: CreateCourseDto) {
        this._validatePrice(dto.pricePerMonth);
        if (dto.lessonDurationMin) this._validateDuration(dto.lessonDurationMin);
        if (dto.lessonsPerWeek) this._validateLessonsPerWeek(dto.lessonsPerWeek);
        if (dto.durationMonths && dto.durationMonths < 1) {
            throw new AppError('Kurs davomiyligi kamida 1 oy bo\'lishi kerak', 400, 'INVALID_DURATION');
        }
    }

    private _validatePrice(price: number) {
        if (price < 0) {
            throw new AppError('Narx manfiy bo\'lishi mumkin emas', 400, 'INVALID_PRICE');
        }
    }

    private _validateDuration(minutes: number) {
        if (minutes <= 0 || minutes > 480) {
            throw new AppError(
                'Dars davomiyligi 1–480 daqiqa orasida bo\'lishi kerak',
                400, 'INVALID_LESSON_DURATION'
            );
        }
    }

    private _validateLessonsPerWeek(count: number) {
        if (count < 1 || count > 7) {
            throw new AppError(
                'Haftadagi darslar soni 1–7 orasida bo\'lishi kerak',
                400, 'INVALID_LESSONS_PER_WEEK'
            );
        }
    }
}
