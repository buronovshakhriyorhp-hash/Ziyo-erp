import { AttendanceRepository, AttendanceInput } from '../repositories/attendance.repository';
import { AppError } from '../utils/api-response.util';
import { telegramService } from './telegram.service';
import { pool } from '../config/database';

// ============================================================
// ATTENDANCE SERVICE — Davomat + Billing biznes mantiqi
// ============================================================

export class AttendanceService {
    constructor(private readonly attRepo: AttendanceRepository) { }

    // ════════════════════════════════════════════════════════
    // DAVOMAT RO'YXATI
    // ════════════════════════════════════════════════════════

    async getByLesson(lessonId: number) {
        return this.attRepo.getByLesson(lessonId);
    }

    async getByStudent(studentId: number, opts: {
        from?: string; to?: string; page?: number; limit?: number;
    } = {}) {
        const { page = 1, limit = 30, ...rest } = opts;
        const offset = (page - 1) * limit;
        const { data, total } = await this.attRepo.getByStudent(studentId, { ...rest, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getDebtors(opts: {
        minDebt?: number;
        page?: number;
        limit?: number;
    } = {}) {
        const { page = 1, limit = 20, minDebt = 0 } = opts;
        const offset = (page - 1) * limit;
        const { data, total } = await this.attRepo.getDebtors({ minDebt, limit, offset });
        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    // ════════════════════════════════════════════════════════
    // ⚡ DAVOMAT BELGILASH — ATOMIC (billing bilan birga)
    // ════════════════════════════════════════════════════════

    async markAttendance(opts: {
        lessonId: number;
        markedBy: number;
        students: AttendanceInput[];
        teacherStatus: 'present' | 'absent' | 'late' | 'substitute';
        teacherLateMinutes?: number;
        substituteTeacherId?: number | null;
        applyBilling?: boolean;
        reqContext: { managerId: number; managerName: string; ip: string; ua: string };
    }) {
        if (!opts.students.length) {
            throw new AppError('Kamida bitta talaba bo\'lishi kerak', 400, 'EMPTY_STUDENTS');
        }

        // Status validatsiya
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        for (const s of opts.students) {
            if (!validStatuses.includes(s.status)) {
                throw new AppError(
                    `Noto'g'ri status: "${s.status}". Ruxsat etilgan: ${validStatuses.join(', ')}`,
                    400, 'INVALID_STATUS'
                );
            }
        }

        // Duplication Check (Sanalgan dars uchun davomat bor-yo'qligini tekshirish repo'da UPSERT orqali hal qilingan, 
        // lekin biz "bir guruh uchun bir kunda bir marta" shartini hisobga olamiz.)
        // Eslatma: Hozirgi repo UPSERT qiladi, bu foydalanuvchiga xatoni to'g'rilash imkonini beradi.

        const result = await this.attRepo.markBulkAttendance(opts);

        // SMS / Telegram Tizimi
        // Agar o'quvchi absence bo'lsa, xabarnoma jo'natamiz
        const absentees = opts.students.filter(s => s.status === 'absent');
        if (absentees.length > 0) {
            // Guruh va dars malumotlarini olish
            const { rows: [lessonObj] } = await pool.query(`
                SELECT g.name AS group_name, u.first_name || ' ' || u.last_name AS teacher_name, l.lesson_date
                FROM erp.lessons l
                JOIN erp.groups g ON g.id = l.group_id
                JOIN erp.users u ON u.id = g.teacher_id
                WHERE l.id = $1
            `, [opts.lessonId]);

            // Har bir "absent" student uchun ota onani yechish
            for (const ab of absentees) {
                // Fetch student details
                const { rows: [stu] } = await pool.query(`
                    SELECT u.first_name || ' ' || u.last_name AS full_name
                    FROM erp.student_profiles sp
                    JOIN erp.users u ON u.id = sp.user_id
                    WHERE sp.id = $1
                `, [ab.studentId]);

                if (stu && lessonObj) {
                    // Aslida chatId ni ota onaga ulash lozim. Xozircha tahrir etmaymiz faqat admin/manager telegram guruhga tushadi
                    await telegramService.sendAbsenceNotification({
                        chatId: '', // Default dan foydalanadi admin bot group
                        studentName: stu.full_name,
                        groupName: lessonObj.group_name,
                        lessonDate: lessonObj.lesson_date,
                        teacherName: lessonObj.teacher_name
                    });
                }
            }
        }

        // Billing xulosasi
        const totalBilled = result.billing.filter(b => b.billed).length;
        const totalAmount = result.billing.reduce((s, b) => s + b.amount, 0);
        const newDebtors = result.billing.filter(
            b => b.newDebtStatus === 'overdue' || b.remainingDebt > 0
        ).length;

        return {
            ...result,
            summary: {
                totalStudents: opts.students.length,
                presentCount: opts.students.filter(s => s.status === 'present').length,
                absentCount: opts.students.filter(s => s.status === 'absent').length,
                lateCount: opts.students.filter(s => s.status === 'late').length,
                excusedCount: opts.students.filter(s => s.status === 'excused').length,
                billedStudents: totalBilled,
                totalBilledAmount: parseFloat(totalAmount.toFixed(2)),
                studentsWithDebt: newDebtors,
            },
        };
    }

    // O'qituvchi davomatini alohida belgilash
    async markTeacherAttendance(opts: {
        lessonId: number;
        teacherId: number;
        status: 'present' | 'absent' | 'late' | 'substitute';
        lateMinutes?: number;
        substituteId?: number | null;
        markedBy: number;
        notes?: string | null;
    }) {
        await this.attRepo.markTeacherAttendance(opts);
        return { message: 'O\'qituvchi davomati belgilandi' };
    }
}
