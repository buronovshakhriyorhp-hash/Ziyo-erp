import { PoolClient } from 'pg';
import { query, withAuditContext } from '../config/database';

// ============================================================
// ATTENDANCE REPOSITORY
// Jadvalar: student_attendance, teacher_attendance,
//           payments, payment_debts, lessons
//
// ⚡ Asosiy murakkablik:
//   markBulkStudentAttendance() — bitta tranzaksiyada:
//     1. Davomat belgilanadi
//     2. Har bir "present" talaba uchun dars haqqi yechiladi
//     3. Balans manfiy bo'lsa — qarz holati yangilanadi
// ============================================================

export interface StudentAttendanceRecord {
    id: number;
    lessonId: number;
    lessonDate: string;
    studentId: number;
    studentName: string;
    groupName: string;
    courseName: string;
    status: AttendanceStatus;
    lateMinutes: number;
    markedBy: number | null;
    markedByName: string | null;
    notes: string | null;
    billedAmount: number | null;  // O'sha dars uchun yechilgan summa
    createdAt: Date;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface TeacherAttendanceRecord {
    id: number;
    lessonId: number;
    teacherId: number;
    teacherName: string;
    status: 'present' | 'absent' | 'late' | 'substitute';
    lateMinutes: number;
    substituteId: number | null;
    substituteName: string | null;
    markedBy: number | null;
    notes: string | null;
}

export interface AttendanceInput {
    studentId: number;
    status: AttendanceStatus;
    lateMinutes?: number;
    notes?: string | null;
}

export interface BillingResult {
    studentId: number;
    studentName: string;
    billed: boolean;
    amount: number;
    newDebtStatus: string | null;
    remainingDebt: number;
}

// ──────────────────────────────────────────────────────────────
// MAPPERS
// ──────────────────────────────────────────────────────────────

function mapStudentAtt(r: Record<string, unknown>): StudentAttendanceRecord {
    return {
        id: r.id as number,
        lessonId: r.lesson_id as number,
        lessonDate: r.lesson_date as string,
        studentId: r.student_id as number,
        studentName: r.student_name as string,
        groupName: r.group_name as string,
        courseName: r.course_name as string,
        status: r.status as AttendanceStatus,
        lateMinutes: r.late_minutes as number ?? 0,
        markedBy: r.marked_by as number | null,
        markedByName: r.marked_by_name as string | null,
        notes: r.notes as string | null,
        billedAmount: r.billed_amount ? parseFloat(r.billed_amount as string) : null,
        createdAt: new Date(r.created_at as string),
    };
}

export class AttendanceRepository {

    // ════════════════════════════════════════════════════════
    // O'QISH
    // ════════════════════════════════════════════════════════

    async getByLesson(lessonId: number): Promise<StudentAttendanceRecord[]> {
        const rows = await query<Record<string, unknown>>(
            `SELECT
               sa.id, sa.lesson_id,
               l.lesson_date,
               sa.student_id,
               u.first_name || ' ' || u.last_name  AS student_name,
               g.name  AS group_name,
               c.name  AS course_name,
               sa.status, sa.late_minutes,
               sa.marked_by,
               mu.first_name || ' ' || mu.last_name AS marked_by_name,
               sa.notes,
               NULL::NUMERIC AS billed_amount,
               sa.created_at
             FROM student_attendance sa
             JOIN lessons l  ON l.id  = sa.lesson_id
             JOIN groups  g  ON g.id  = l.group_id
             JOIN courses c  ON c.id  = g.course_id
             JOIN student_profiles sp ON sp.id = sa.student_id
             JOIN users u  ON u.id  = sp.user_id
             LEFT JOIN users mu ON mu.id = sa.marked_by
             WHERE sa.lesson_id = $1 AND sa.deleted_at IS NULL
             ORDER BY u.last_name, u.first_name`,
            [lessonId]
        );
        return rows.map(mapStudentAtt);
    }

    async getByStudent(studentId: number, opts: {
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: StudentAttendanceRecord[]; total: number }> {
        const { from, to, limit = 30, offset = 0 } = opts;
        const cond: string[] = ['sa.student_id = $1', 'sa.deleted_at IS NULL'];
        const params: unknown[] = [studentId];
        let i = 2;

        if (from) { cond.push(`l.lesson_date >= $${i++}::DATE`); params.push(from); }
        if (to) { cond.push(`l.lesson_date <= $${i++}::DATE`); params.push(to); }

        const where = cond.join(' AND ');
        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM student_attendance sa
             JOIN lessons l ON l.id = sa.lesson_id
             WHERE ${where}`, params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `SELECT
               sa.id, sa.lesson_id,
               l.lesson_date,
               sa.student_id,
               u.first_name || ' ' || u.last_name AS student_name,
               g.name AS group_name,
               c.name AS course_name,
               sa.status, sa.late_minutes,
               sa.marked_by,
               mu.first_name || ' ' || mu.last_name AS marked_by_name,
               sa.notes,
               NULL::NUMERIC AS billed_amount,
               sa.created_at
             FROM student_attendance sa
             JOIN lessons l  ON l.id = sa.lesson_id
             JOIN groups  g  ON g.id = l.group_id
             JOIN courses c  ON c.id = g.course_id
             JOIN student_profiles sp ON sp.id = sa.student_id
             JOIN users u  ON u.id = sp.user_id
             LEFT JOIN users mu ON mu.id = sa.marked_by
             WHERE ${where}
             ORDER BY l.lesson_date DESC
             LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapStudentAtt), total };
    }

    // ════════════════════════════════════════════════════════
    // ⚡ DAVOMAT BELGILASH + BILLING (ATOMIC TRANSACTION)
    //
    // Bir tranzaksiyada:
    //  1. student_attendance ga davomatni yoz/yangilash (UPSERT)
    //  2. Teacher attendance yoz
    //  3. Har bir "present" (yoki "late") talaba uchun:
    //     a. Kurs narxidan bir kunlik haqni hisoblash
    //        = price_per_month / lessons_per_month
    //     b. Talabaning payment_debts da shu dars uchun debit yoz
    //     c. Agar jami qarz musbat bo'lsa — status='overdue' qo'y
    // ════════════════════════════════════════════════════════

    async markBulkAttendance(opts: {
        lessonId: number;
        markedBy: number;
        students: AttendanceInput[];
        teacherStatus: 'present' | 'absent' | 'late' | 'substitute';
        teacherLateMinutes?: number;
        substituteTeacherId?: number | null;
        applyBilling?: boolean;
        reqContext: { managerId: number; managerName: string; ip: string; ua: string };
    }): Promise<{ records: StudentAttendanceRecord[]; billing: BillingResult[] }> {

        return withAuditContext(
            opts.reqContext.managerId,
            opts.reqContext.managerName,
            opts.reqContext.ip,
            opts.reqContext.ua,
            async (client: PoolClient) => {
                await client.query('SET search_path = erp');

                // ─── Dars va guruh ma'lumotlarini olish ───────────────────
                const { rows: [lesson] } = await client.query(
                    `SELECT
                   l.id, l.lesson_date, l.group_id, l.status AS lesson_status,
                   g.teacher_id, g.course_id, g.day_combination_id,
                   c.price_per_month, c.lessons_per_week,
                   c.duration_months
                 FROM lessons l
                 JOIN groups  g ON g.id = l.group_id
                 JOIN courses c ON c.id = g.course_id
                 WHERE l.id = $1 AND l.deleted_at IS NULL`,
                    [opts.lessonId]
                );
                if (!lesson) throw new Error('Dars topilmadi');
                if (lesson.lesson_status === 'cancelled') {
                    throw new Error('Bekor qilingan darsga davomat qilib bo\'lmaydi');
                }

                // Bir oylik darslar soni = lessons_per_week * 4.33 hafta
                const lessonsPerMonth = Math.round(
                    parseFloat(lesson.lessons_per_week) * 4.33
                );
                // Bir dars haqqi
                const pricePerLesson = parseFloat(lesson.price_per_month) / lessonsPerMonth;

                // ─── 1. O'qituvchi davomati ────────────────────────────────
                await client.query(
                    `INSERT INTO teacher_attendance
                   (lesson_id, teacher_id, status, late_minutes, substitute_id, marked_by)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (lesson_id, teacher_id) DO UPDATE
                   SET status = EXCLUDED.status,
                       late_minutes = EXCLUDED.late_minutes,
                       substitute_id = EXCLUDED.substitute_id,
                       marked_by = EXCLUDED.marked_by`,
                    [
                        opts.lessonId,
                        lesson.teacher_id,
                        opts.teacherStatus,
                        opts.teacherLateMinutes ?? 0,
                        opts.substituteTeacherId ?? null,
                        opts.markedBy,
                    ]
                );

                // ─── 2. Darsni 'completed' ga o'tkazish ───────────────────
                await client.query(
                    `UPDATE lessons SET status = 'completed'
                 WHERE id = $1 AND status != 'cancelled'`,
                    [opts.lessonId]
                );

                // ─── 3. Har bir talaba davomati + billing ─────────────────
                const billingResults: BillingResult[] = [];
                const attendanceIds: number[] = [];

                for (const stu of opts.students) {
                    // UPSERT davomat
                    const { rows: [attRow] } = await client.query(
                        `INSERT INTO student_attendance
                       (lesson_id, student_id, status, late_minutes, notes, marked_by)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (lesson_id, student_id) DO UPDATE
                       SET status      = EXCLUDED.status,
                           late_minutes= EXCLUDED.late_minutes,
                           notes       = EXCLUDED.notes,
                           marked_by   = EXCLUDED.marked_by
                     RETURNING id`,
                        [
                            opts.lessonId,
                            stu.studentId,
                            stu.status,
                            stu.lateMinutes ?? 0,
                            stu.notes ?? null,
                            opts.markedBy,
                        ]
                    );
                    attendanceIds.push(attRow.id as number);

                    // Billing — faqat kelgan talablardan pul yechiladi
                    const isBillable = stu.status === 'present' || stu.status === 'late';

                    // Talaba ismini olish
                    const { rows: [stuInfo] } = await client.query(
                        `SELECT u.first_name || ' ' || u.last_name AS name
                     FROM student_profiles sp JOIN users u ON u.id = sp.user_id
                     WHERE sp.id = $1`,
                        [stu.studentId]
                    );

                    if (isBillable && opts.applyBilling !== false) {
                        // Talabaning shu guruhgagi aktiv enrollment topish
                        const { rows: [enroll] } = await client.query(
                            `SELECT ge.id AS enrollment_id,
                                ge.discount_pct
                         FROM group_enrollments ge
                         WHERE ge.group_id  = $1
                           AND ge.student_id = $2
                           AND ge.status IN ('active', 'frozen')
                           AND ge.deleted_at IS NULL
                         LIMIT 1`,
                            [lesson.group_id, stu.studentId]
                        );

                        if (enroll) {
                            // Chegirmani hisobga olish
                            const discount = parseFloat(enroll.discount_pct ?? '0');
                            const billAmount = parseFloat(
                                (pricePerLesson * (1 - discount / 100)).toFixed(2)
                            );

                            // Shu dars oyi uchun qarz topish yoki yaratish
                            const lessonMonth = lesson.lesson_date.substring(0, 8) + '01';

                            const { rows: [existingDebt] } = await client.query(
                                `SELECT id, amount_due, amount_paid
                             FROM payment_debts
                             WHERE enrollment_id = $1
                               AND due_month = $2::DATE
                               AND deleted_at IS NULL
                             FOR UPDATE`,
                                [enroll.enrollment_id, lessonMonth]
                            );

                            let debtStatus: string;
                            let remainingDebt: number;

                            if (existingDebt) {
                                // Mavjud qarzga dars haqqini qo'sh
                                const newDue = parseFloat(existingDebt.amount_due) + billAmount;
                                const paid = parseFloat(existingDebt.amount_paid);
                                const remaining = newDue - paid;
                                debtStatus = remaining > 0 ? 'pending' : 'paid';
                                remainingDebt = Math.max(0, remaining);

                                // Muddati o'tganligi tekshirish
                                const { rows: [today] } = await client.query('SELECT CURRENT_DATE AS d');
                                const dueDate = new Date(existingDebt.due_date as string ?? today.d);
                                if (remaining > 0 && new Date(today.d as string) > dueDate) {
                                    debtStatus = 'overdue';
                                }

                                await client.query(
                                    `UPDATE payment_debts SET amount_due = $1, status = $2
                                 WHERE id = $3`,
                                    [newDue, debtStatus, existingDebt.id]
                                );
                            } else {
                                // Yangi oylik qarz yaratish
                                const nextMonth = new Date(lessonMonth);
                                nextMonth.setMonth(nextMonth.getMonth() + 1);
                                const dueDate = nextMonth.toISOString().split('T')[0];

                                await client.query(
                                    `INSERT INTO payment_debts
                                   (enrollment_id, student_id, due_month, amount_due, due_date, status)
                                 VALUES ($1, $2, $3::DATE, $4, $5::DATE, 'pending')`,
                                    [
                                        enroll.enrollment_id,
                                        stu.studentId,
                                        lessonMonth,
                                        billAmount,
                                        dueDate,
                                    ]
                                );
                                debtStatus = 'pending';
                                remainingDebt = billAmount;
                            }

                            billingResults.push({
                                studentId: stu.studentId,
                                studentName: stuInfo?.name ?? 'Noma\'lum',
                                billed: true,
                                amount: billAmount,
                                newDebtStatus: debtStatus,
                                remainingDebt,
                            });
                        } else {
                            // Enrollment topilmadi
                            billingResults.push({
                                studentId: stu.studentId,
                                studentName: stuInfo?.name ?? 'Noma\'lum',
                                billed: false,
                                amount: 0,
                                newDebtStatus: null,
                                remainingDebt: 0,
                            });
                        }
                    } else {
                        billingResults.push({
                            studentId: stu.studentId,
                            studentName: stuInfo?.name ?? 'Noma\'lum',
                            billed: false,
                            amount: 0,
                            newDebtStatus: null,
                            remainingDebt: 0,
                        });
                    }
                }

                // Yozilgan davomatlarni qaytarish
                const { rows: attRows } = await client.query(
                    `SELECT
                   sa.id, sa.lesson_id,
                   l.lesson_date,
                   sa.student_id,
                   u.first_name || ' ' || u.last_name AS student_name,
                   g.name AS group_name,
                   c.name AS course_name,
                   sa.status, sa.late_minutes,
                   sa.marked_by,
                   mu.first_name || ' ' || mu.last_name AS marked_by_name,
                   sa.notes,
                   NULL::NUMERIC AS billed_amount,
                   sa.created_at
                 FROM student_attendance sa
                 JOIN lessons l  ON l.id = sa.lesson_id
                 JOIN groups  g  ON g.id = l.group_id
                 JOIN courses c  ON c.id = g.course_id
                 JOIN student_profiles sp ON sp.id = sa.student_id
                 JOIN users u  ON u.id = sp.user_id
                 LEFT JOIN users mu ON mu.id = sa.marked_by
                 WHERE sa.id = ANY($1)
                 ORDER BY u.last_name`,
                    [attendanceIds]
                );

                return {
                    records: attRows.map(mapStudentAtt),
                    billing: billingResults,
                };
            });
    }

    // ════════════════════════════════════════════════════════
    // QARZDORLAR RO'YXATI
    // (finance modulidagi view_overdue_debts ga tengma-emas —
    //  bu bu yerda "qayta qo'ng'iroq kerak" kontekstida)
    // ════════════════════════════════════════════════════════

    async getDebtors(opts: {
        minDebt?: number;  // Minimum qarz summasi
        limit?: number;
        offset?: number;
    } = {}): Promise<{
        data: {
            studentId: number;
            studentName: string;
            phone: string;
            totalDebt: number;
            overdueMonths: number;
            groups: string[];
        }[];
        total: number;
    }> {
        const { minDebt = 0, limit = 20, offset = 0 } = opts;

        const rows = await query<Record<string, unknown>>(
            `SELECT
               sp.id                                AS student_id,
               u.first_name || ' ' || u.last_name  AS student_name,
               u.phone,
               SUM(pd.amount_due - pd.amount_paid) AS total_debt,
               COUNT(*) FILTER (WHERE pd.status = 'overdue')  AS overdue_months,
               ARRAY_AGG(DISTINCT g.name)           AS groups
             FROM payment_debts pd
             JOIN student_profiles sp ON sp.id = pd.student_id
             JOIN users u ON u.id = sp.user_id
             JOIN group_enrollments ge ON ge.id = pd.enrollment_id
             JOIN groups g ON g.id = ge.group_id
             WHERE pd.status IN ('pending','partial','overdue')
               AND pd.deleted_at IS NULL
               AND sp.deleted_at IS NULL
               AND u.deleted_at IS NULL
             GROUP BY sp.id, u.first_name, u.last_name, u.phone
             HAVING SUM(pd.amount_due - pd.amount_paid) > $1
             ORDER BY total_debt DESC
             LIMIT $2 OFFSET $3`,
            [minDebt, limit, offset]
        );

        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(DISTINCT pd.student_id) AS count
             FROM payment_debts pd
             WHERE pd.status IN ('pending','partial','overdue')
               AND pd.deleted_at IS NULL`
        );

        return {
            data: rows.map(r => ({
                studentId: r.student_id as number,
                studentName: r.student_name as string,
                phone: r.phone as string,
                totalDebt: parseFloat(r.total_debt as string),
                overdueMonths: parseInt(r.overdue_months as string, 10),
                groups: r.groups as string[],
            })),
            total: parseInt(ct?.count ?? '0', 10),
        };
    }

    // O'qituvchi davomati yozish (alohida endpoint)
    async markTeacherAttendance(opts: {
        lessonId: number;
        teacherId: number;
        status: 'present' | 'absent' | 'late' | 'substitute';
        lateMinutes?: number;
        substituteId?: number | null;
        markedBy: number;
        notes?: string | null;
    }): Promise<void> {
        await query(
            `INSERT INTO teacher_attendance
               (lesson_id, teacher_id, status, late_minutes, substitute_id, marked_by, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (lesson_id, teacher_id) DO UPDATE
               SET status = EXCLUDED.status,
                   late_minutes = EXCLUDED.late_minutes,
                   substitute_id = EXCLUDED.substitute_id,
                   marked_by = EXCLUDED.marked_by,
                   notes = EXCLUDED.notes`,
            [
                opts.lessonId, opts.teacherId, opts.status,
                opts.lateMinutes ?? 0, opts.substituteId ?? null,
                opts.markedBy, opts.notes ?? null,
            ]
        );
    }

    // ════════════════════════════════════════════════════════
    // SOFT DELETE
    // ════════════════════════════════════════════════════════

    /**
     * Talaba davomatini o'chirish (soft delete).
     * O'chirilgan davomat tarix uchun saqlanadi lekin ro'yxatga chiqmaydi.
     */
    async softDeleteStudentAttendance(id: number): Promise<void> {
        await query(
            `UPDATE student_attendance
             SET deleted_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    /**
     * O'qituvchi davomatini o'chirish (soft delete).
     */
    async softDeleteTeacherAttendance(id: number): Promise<void> {
        await query(
            `UPDATE teacher_attendance
             SET deleted_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
