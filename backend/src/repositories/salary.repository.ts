import { query, withTransaction } from '../config/database';

// ============================================================
// SALARY REPOSITORY
// Jadval: teacher_salary_periods
//
//   KPI hisob-kitobi:
//   total_salary = base_salary + kpi_bonus - deductions
//   kpi_bonus    = base_salary * kpi_rate/100 * attendance_rate/100 * collection_rate/100
// ============================================================


export interface SalaryPeriodNormalized {
    id: number;
    teacherId: number;
    teacherName: string;
    specialization: string | null;
    periodMonth: string;
    totalLessonsPlanned: number;
    totalLessonsConducted: number;
    attendanceRate: number;
    baseSalary: number;
    kpiBonus: number;
    deductions: number;
    totalSalary: number;
    kpiDetails: Record<string, unknown> | null;
    status: 'calculated' | 'approved' | 'paid';
    paidAt: Date | null;
    approvedBy: number | null;
    notes: string | null;
    createdAt: Date;
}

function mapSalary(r: Record<string, unknown>): SalaryPeriodNormalized {
    return {
        id: r.id as number,
        teacherId: r.teacher_id as number,
        teacherName: r.teacher_name as string,
        specialization: r.specialization as string | null,
        periodMonth: r.period_month as string,
        totalLessonsPlanned: r.total_lessons_planned as number,
        totalLessonsConducted: r.total_lessons_conducted as number,
        attendanceRate: parseFloat(r.attendance_rate as string),
        baseSalary: parseFloat(r.base_salary as string),
        kpiBonus: parseFloat(r.kpi_bonus as string),
        deductions: parseFloat(r.deductions as string),
        totalSalary: parseFloat(r.total_salary as string),
        kpiDetails: (r.kpi_details ?? null) as Record<string, unknown> | null,
        status: r.status as SalaryPeriodNormalized['status'],
        paidAt: r.paid_at ? new Date(r.paid_at as string) : null,
        approvedBy: r.approved_by as number | null,
        notes: r.notes as string | null,
        createdAt: new Date(r.created_at as string),
    };
}

const SAL_SELECT = `
  SELECT
    tsp.*,
    u.first_name || ' ' || u.last_name AS teacher_name,
    tp.specialization
  FROM teacher_salary_periods tsp
  JOIN teacher_profiles tp ON tp.id = tsp.teacher_id
  JOIN users u ON u.id = tp.user_id
  WHERE tsp.deleted_at IS NULL
`;

export class SalaryRepository {

    async findAll(opts: {
        teacherId?: number;
        status?: string;
        year?: number;
        month?: number;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: SalaryPeriodNormalized[]; total: number }> {
        const { teacherId, status, year, month, limit = 20, offset = 0 } = opts;
        const cond: string[] = ['tsp.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (teacherId) { cond.push(`tsp.teacher_id        = $${i++}`); params.push(teacherId); }
        if (status) { cond.push(`tsp.status            = $${i++}`); params.push(status); }
        if (year) { cond.push(`EXTRACT(YEAR FROM tsp.period_month) = $${i++}`); params.push(year); }
        if (month) { cond.push(`EXTRACT(MONTH FROM tsp.period_month) = $${i++}`); params.push(month); }

        const where = cond.join(' AND ');
        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM teacher_salary_periods tsp
             WHERE ${where}`, params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `${SAL_SELECT.replace('WHERE tsp.deleted_at IS NULL', `WHERE ${where}`)}
             ORDER BY tsp.period_month DESC LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapSalary), total };
    }

    async findById(id: number): Promise<SalaryPeriodNormalized | null> {
        const rows = await query<Record<string, unknown>>(
            `${SAL_SELECT} AND tsp.id = $1`, [id]
        );
        return rows.length ? mapSalary(rows[0]) : null;
    }

    // ============================================================
    // SALARY SETTINGS
    // ============================================================

    async getSettings(teacherId: number) {
        const rows = await query(
            `SELECT * FROM teacher_salary_settings 
             WHERE teacher_id = $1 AND deleted_at IS NULL`,
            [teacherId]
        );
        return rows[0] || null;
    }

    async updateSettings(data: {
        teacherId: number;
        salaryMode: 'fixed' | 'per_lesson' | 'percentage' | 'calculated';
        amount: number;
        kpiRate: number;
    }) {
        const { teacherId, salaryMode, amount, kpiRate } = data;
        const rows = await query(
            `INSERT INTO teacher_salary_settings (teacher_id, salary_mode, amount, kpi_rate)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (teacher_id) DO UPDATE 
             SET salary_mode = EXCLUDED.salary_mode,
                 amount = EXCLUDED.amount,
                 kpi_rate = EXCLUDED.kpi_rate,
                 updated_at = NOW()
             RETURNING *`,
            [teacherId, salaryMode, amount, kpiRate]
        );
        return rows[0];
    }

    // ============================================================
    // CALCULATION LOGIC
    // ============================================================

    async calculateAndSave(
        teacherId: number,
        periodMonth: string,   // 'YYYY-MM-01'
        deductions: number = 0,
        notes?: string
    ): Promise<SalaryPeriodNormalized> {
        return withTransaction(async (client) => {
            await client.query('SET search_path = erp');

            // 1. O'qituvchi sozlamalarini olish
            const { rows: [settings] } = await client.query(
                `SELECT * FROM teacher_salary_settings 
                 WHERE teacher_id = $1 AND deleted_at IS NULL`,
                [teacherId]
            );

            // Agar sozlamalar bo'lmasa, teacher_profile dan defaultlarni olamiz
            let salaryMode = settings?.salary_mode || 'calculated';
            let amount = settings ? parseFloat(settings.amount) : 0;
            let kpiRate = settings ? parseFloat(settings.kpi_rate) : 0;

            if (!settings) {
                const { rows: [profile] } = await client.query(
                    `SELECT base_salary, kpi_rate FROM teacher_profiles WHERE id = $1`,
                    [teacherId]
                );
                if (profile) {
                    amount = parseFloat(profile.base_salary);
                    kpiRate = parseFloat(profile.kpi_rate);
                }
            }

            // 2. Rejalashtirilgan va o'tilgan darslar
            const { rows: [lessonsInfo] } = await client.query(
                `SELECT 
                    COUNT(*) AS planned,
                    COUNT(*) FILTER (WHERE status = 'completed') AS conducted
                 FROM lessons l
                 JOIN groups g ON g.id = l.group_id
                 WHERE g.teacher_id = $1
                   AND l.lesson_date >= $2::DATE
                   AND l.lesson_date <  $2::DATE + INTERVAL '1 month'
                   AND l.deleted_at IS NULL`,
                [teacherId, periodMonth]
            );
            const totalPlanned = parseInt(lessonsInfo.planned, 10);
            const totalConducted = parseInt(lessonsInfo.conducted, 10);

            // 3. Davomat ko'rsatkichi
            const { rows: [att] } = await client.query(
                `SELECT
                   COUNT(*) AS total_records,
                   COUNT(*) FILTER (WHERE sa.status = 'present') AS present_count
                 FROM student_attendance sa
                 JOIN lessons l ON l.id = sa.lesson_id
                 JOIN groups g ON g.id = l.group_id
                 WHERE g.teacher_id = $1
                   AND l.lesson_date >= $2::DATE
                   AND l.lesson_date <  $2::DATE + INTERVAL '1 month'
                   AND sa.deleted_at IS NULL`,
                [teacherId, periodMonth]
            );
            const totalRecords = parseInt(att.total_records, 10);
            const presentCount = parseInt(att.present_count, 10);
            const attendanceRate = totalRecords > 0
                ? parseFloat(((presentCount / totalRecords) * 100).toFixed(2))
                : 0;

            // 3.5. To'lov yig'iluvchanligi (Collection Rate)
            const { rows: [collection] } = await client.query(
                `SELECT
                   COALESCE(SUM(pd.amount_due), 0) AS total_due,
                   COALESCE(SUM(pd.amount_paid), 0) AS total_paid
                 FROM payment_debts pd
                 JOIN group_enrollments ge ON ge.id = pd.enrollment_id
                 JOIN groups g ON g.id = ge.group_id
                 WHERE g.teacher_id = $1
                   AND pd.due_month = $2::DATE
                   AND pd.deleted_at IS NULL`,
                [teacherId, periodMonth]
            );
            const totalDue = parseFloat(collection.total_due || '0');
            const totalPaid = parseFloat(collection.total_paid || '0');
            const collectionRate = totalDue > 0
                ? parseFloat(((totalPaid / totalDue) * 100).toFixed(2))
                : (totalPlanned > 0 ? 0 : 100);

            // 4. MAOSH HISOBLASH YO'LLARI
            let baseSalaryCalculated = 0;
            let kpiBonus = 0;

            if (salaryMode === 'fixed' || salaryMode === 'calculated') {
                baseSalaryCalculated = amount;
                // KPI bonus formula updates: considers both attendance rate and collection rate
                kpiBonus = parseFloat((baseSalaryCalculated * (kpiRate / 100) * (attendanceRate / 100) * (collectionRate / 100)).toFixed(2));
            }
            else if (salaryMode === 'per_lesson') {
                baseSalaryCalculated = totalConducted * amount;
                // Darsbayda ham mantiqan yig'iluvchanlik ni xisobga olish mumkun
                kpiBonus = 0;
            }
            else if (salaryMode === 'percentage') {
                // Guruhdan tushgan jami pullar (%)
                const { rows: [revenue] } = await client.query(
                    `SELECT SUM(p.amount) AS total
                     FROM payments p
                     JOIN group_enrollments ge ON ge.id = p.enrollment_id
                     JOIN groups g ON g.id = ge.group_id
                     WHERE g.teacher_id = $1
                       AND DATE_TRUNC('month', p.payment_date) = $2::DATE
                       AND p.deleted_at IS NULL`,
                    [teacherId, periodMonth]
                );
                const totalRev = parseFloat(revenue.total || '0');
                baseSalaryCalculated = parseFloat((totalRev * (amount / 100)).toFixed(2));
                kpiBonus = 0;
            }

            const kpiDetails = {
                salaryMode,
                rate: amount,
                kpiRate,
                attendanceRate,
                collectionRate,
                lessonsPlanned: totalPlanned,
                lessonsConducted: totalConducted,
            };

            // 5. Saqlash
            const { rows: [saved] } = await client.query(
                `INSERT INTO teacher_salary_periods
                   (teacher_id, period_month, total_lessons_planned, total_lessons_conducted,
                    attendance_rate, base_salary, kpi_bonus, deductions, kpi_details, notes)
                 VALUES ($1, $2::DATE, $3, $4, $5, $6, $7, $8, $9::JSONB, $10)
                 ON CONFLICT (teacher_id, period_month) DO UPDATE
                   SET total_lessons_planned   = EXCLUDED.total_lessons_planned,
                       total_lessons_conducted = EXCLUDED.total_lessons_conducted,
                       attendance_rate         = EXCLUDED.attendance_rate,
                       base_salary             = EXCLUDED.base_salary,
                       kpi_bonus               = EXCLUDED.kpi_bonus,
                       deductions              = EXCLUDED.deductions,
                       kpi_details             = EXCLUDED.kpi_details,
                       notes                   = EXCLUDED.notes
                 RETURNING id`,
                [
                    teacherId, periodMonth, totalPlanned, totalConducted,
                    attendanceRate, baseSalaryCalculated, kpiBonus, deductions,
                    JSON.stringify(kpiDetails), notes ?? null
                ]
            );

            return (await this.findById(saved.id))!;
        });
    }

    async approve(id: number, approvedBy: number): Promise<SalaryPeriodNormalized | null> {
        await query(
            `UPDATE teacher_salary_periods
             SET status = 'approved', approved_by = $1
             WHERE id = $2 AND status = 'calculated' AND deleted_at IS NULL`,
            [approvedBy, id]
        );
        return this.findById(id);
    }

    // ============================================================
    // PAYOUTS (Actual Payment)
    // ============================================================

    async markPaid(
        id: number,
        paymentMethodId?: number
    ): Promise<SalaryPeriodNormalized | null> {
        return withTransaction(async (client) => {
            await client.query('SET search_path = erp');

            const { rows: [sal] } = await client.query(
                `SELECT * FROM teacher_salary_periods WHERE id = $1 AND status = 'approved'`,
                [id]
            );
            if (!sal) throw new Error('Tasdiqlangan maosh topilmadi');

            // 1. Statusni yangilash
            await client.query(
                `UPDATE teacher_salary_periods
                 SET status = 'paid', paid_at = NOW(),
                     payment_method_id = $1
                 WHERE id = $2`,
                [paymentMethodId ?? null, id]
            );

            // 2. Payouts jadvaliga yozish
            await client.query(
                `INSERT INTO teacher_payouts (teacher_id, salary_period_id, amount, payment_method_id, paid_by)
                 VALUES ($1, $2, $3, $4, $5)`,
                [sal.teacher_id, id, sal.total_salary, paymentMethodId ?? null, sal.approved_by]
            );

            // 3. Finance Expenses ga yozish (O'qituvchi oyligi)
            const { rows: [cat] } = await client.query(
                `SELECT id FROM expense_categories WHERE name ILIKE '%Xodimlar%' LIMIT 1`
            );

            await client.query(
                `INSERT INTO expenses (category_id, amount, expense_date, description, paid_by)
                 VALUES ($1, $2, CURRENT_DATE, $3, $4)`,
                [
                    cat?.id || null,
                    sal.total_salary,
                    `O'qituvchi oyligi: ${sal.period_month} uchun`,
                    sal.approved_by
                ]
            );

            return (await this.findById(id))!;
        });
    }

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE teacher_salary_periods
             SET deleted_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL`, [id]
        );
    }
}
