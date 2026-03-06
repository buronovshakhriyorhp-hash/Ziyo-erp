import { query } from '../config/database';

// ============================================================
// ANALYTICS REPOSITORY
// Mas'uliyat: Tahlil va hisobot uchun murakkab SQL so'rovlar
//
//   1. Financial Summary  — oylik tushum / xarajat / sof foyda
//   2. Student Stats      — guruh/kurs kesimida faol/churned talabalar
//   3. Teacher Performance — dars sifati va davomat
//   4. Revenue Forecast   — keyingi oy kutilayotgan tushum
// ============================================================

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface FinancialSummary {
  month: string;   // 'YYYY-MM'
  totalRevenue: number;   // Jami tushum (to'lovlar)
  totalExpenses: number;   // Jami xarajatlar
  netProfit: number;   // Sof foyda = Revenue - Expenses
  expectedProfit: number; // Kutilayotgan foyda = (Revenue + Pending Debt) - Expenses
  cashflow: number; // Cashflow (Aylanma mablag') = Total Revenue
  profitMargin: number;   // % foiz = netProfit / totalRevenue * 100
  revenueBreakdown: {
    paymentMethod: string;
    amount: number;
    count: number;
  }[];
  expenseBreakdown: {
    category: string;
    amount: number;
    count: number;
  }[];
  pendingDebt: number;   // Hali to'lanmagan qarzlar
  collectionRate: number;   // To'lov yig'ish foizi
}

export interface StudentStats {
  courseId: number;
  courseName: string;
  subjectName: string;
  activeCount: number;     // Hozir faol talabalar
  inactiveCount: number;     // Faolsiz (to'xtatilgan)
  completedCount: number;    // Yakunlagan
  droppedCount: number;     // Tashlab ketgan
  totalEnrolled: number;     // Jami ro'yxatga olingan
  churnRate: number;     // % = dropped / totalEnrolled * 100
  avgAttendance: number;     // Talabalar o'rtacha davomati %
  avgDebt: number;     // O'rtacha qarz
}

export interface TeacherPerformance {
  teacherId: number;
  teacherName: string;
  specialization: string | null;
  groupCount: number;
  totalStudents: number;
  lessonsPlanned: number;
  lessonsConducted: number;
  attendanceRate: number;   // Shu o'qituvchidagi talabalar davomati
  totalRevenue: number;    // Ushbu o'qituvchi guruhlari keltirgan tushum
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  newStudents: number;
  activeStudents: number;
}

export interface DebtorRecord {
  studentId: number;
  studentName: string;
  phone: string;
  email: string | null;
  totalDebt: number;
  overdueMonths: number;
  oldestDebtDate: string;
  groups: string[];
  lastPaymentDate: string | null;
}

// ──────────────────────────────────────────────────────────────
// REPOSITORY
// ──────────────────────────────────────────────────────────────

export class AnalyticsRepository {

  // ════════════════════════════════════════════════════════
  // 1. FINANCIAL SUMMARY
  //    Berilgan oy uchun to'liq moliyaviy xulosa
  // ════════════════════════════════════════════════════════

  async getFinancialSummary(yearMonth: string): Promise<FinancialSummary> {
    // yearMonth format: 'YYYY-MM'
    const monthStart = `${yearMonth}-01`;

    // ─── Jami tushum ─────────────────────────────────────
    const [rev] = await query<{ total: string; pending: string }>(
      `SELECT
               COALESCE(SUM(CASE WHEN pd.status = 'paid' THEN pd.amount_paid ELSE 0 END), 0) AS total,
               COALESCE(SUM(CASE WHEN pd.status IN ('pending','partial','overdue')
                              THEN pd.amount_due - pd.amount_paid ELSE 0 END), 0) AS pending
             FROM payment_debts pd
             WHERE pd.due_month = $1::DATE
               AND pd.deleted_at IS NULL`,
      [monthStart]
    );

    // To'lovlar bo'yicha breakdown
    const revBreakdown = await query<{ payment_method: string; amount: string; count: string }>(
      `SELECT
               pm.name    AS payment_method,
               SUM(p.amount) AS amount,
               COUNT(*)      AS count
             FROM payments p
             JOIN payment_methods pm ON pm.id = p.payment_method_id
             WHERE DATE_TRUNC('month', p.payment_date) = $1::DATE
               AND p.deleted_at IS NULL
             GROUP BY pm.name
             ORDER BY amount DESC`,
      [monthStart]
    );

    // ─── Jami xarajatlar ──────────────────────────────────
    const [exp] = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
             FROM expenses
             WHERE DATE_TRUNC('month', expense_date) = $1::DATE
               AND deleted_at IS NULL`,
      [monthStart]
    );

    const expBreakdown = await query<{ category: string; amount: string; count: string }>(
      `SELECT
               ec.name AS category,
               SUM(e.amount) AS amount,
               COUNT(*)      AS count
             FROM expenses e
             JOIN expense_categories ec ON ec.id = e.category_id
             WHERE DATE_TRUNC('month', e.expense_date) = $1::DATE
               AND e.deleted_at IS NULL
             GROUP BY ec.name
             ORDER BY amount DESC`,
      [monthStart]
    );

    // ─── Yig'ish samaradorligi ────────────────────────────
    const [allDue] = await query<{ due: string; paid: string }>(
      `SELECT
               COALESCE(SUM(amount_due), 0)  AS due,
               COALESCE(SUM(amount_paid), 0) AS paid
             FROM payment_debts
             WHERE due_month = $1::DATE AND deleted_at IS NULL`,
      [monthStart]
    );
    const totalDue = parseFloat(allDue?.due ?? '0');
    const totalPaidFromDue = parseFloat(allDue?.paid ?? '0');
    const collectionRate = totalDue > 0
      ? parseFloat(((totalPaidFromDue / totalDue) * 100).toFixed(2)) : 0;

    const totalRevenue = parseFloat(rev?.total ?? '0');
    const totalExpenses = parseFloat(exp?.total ?? '0');
    const pendingDebt = parseFloat(rev?.pending ?? '0');
    const netProfit = totalRevenue - totalExpenses;
    const expectedProfit = (totalRevenue + pendingDebt) - totalExpenses;
    const cashflow = totalRevenue;

    const profitMargin = totalRevenue > 0
      ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

    return {
      month: yearMonth,
      totalRevenue,
      totalExpenses,
      netProfit,
      expectedProfit,
      cashflow,
      profitMargin,
      revenueBreakdown: revBreakdown.map(r => ({
        paymentMethod: r.payment_method,
        amount: parseFloat(r.amount),
        count: parseInt(r.count, 10),
      })),
      expenseBreakdown: expBreakdown.map(r => ({
        category: r.category,
        amount: parseFloat(r.amount),
        count: parseInt(r.count, 10),
      })),
      pendingDebt,
      collectionRate,
    };
  }

  // ════════════════════════════════════════════════════════
  // 2. STUDENT STATS — Kurs bo'yicha faol/churned %
  //
  //   Churn Rate = dropped / totalEnrolled × 100
  // ════════════════════════════════════════════════════════

  async getStudentStats(courseId?: number): Promise<StudentStats[]> {
    const courseFilter = courseId ? `AND c.id = ${courseId}` : '';

    const rows = await query<Record<string, unknown>>(
      `SELECT
               c.id                    AS course_id,
               c.name                  AS course_name,
               s.name                  AS subject_name,
               COUNT(*) FILTER (WHERE ge.status = 'active')    AS active_count,
               COUNT(*) FILTER (WHERE ge.status = 'inactive')  AS inactive_count,
               COUNT(*) FILTER (WHERE ge.status = 'completed') AS completed_count,
               COUNT(*) FILTER (WHERE ge.status = 'dropped')   AS dropped_count,
               COUNT(*)                                          AS total_enrolled,
               -- Davomat foizi (so'nggi 30 kun)
               ROUND(
                 AVG(
                   CASE WHEN att_stats.total_lessons > 0
                     THEN att_stats.present_lessons::NUMERIC / att_stats.total_lessons * 100
                     ELSE 100
                   END
                 )::NUMERIC, 2
               ) AS avg_attendance,
               -- O'rtacha qarz
               ROUND(AVG(COALESCE(debt_stats.total_debt, 0))::NUMERIC, 2) AS avg_debt
             FROM group_enrollments ge
             JOIN groups  g ON g.id = ge.group_id
             JOIN courses c ON c.id = g.course_id
             JOIN subjects s ON s.id = c.subject_id
             -- Davomat sub-query
             LEFT JOIN LATERAL (
               SELECT
                 COUNT(sa.id) AS total_lessons,
                 COUNT(sa.id) FILTER (WHERE sa.status IN ('present','late')) AS present_lessons
               FROM student_attendance sa
               JOIN lessons l ON l.id = sa.lesson_id
               WHERE sa.student_id = ge.student_id
                 AND l.lesson_date >= CURRENT_DATE - INTERVAL '30 days'
                 AND sa.deleted_at IS NULL
             ) att_stats ON TRUE
             -- Qarz sub-query
             LEFT JOIN LATERAL (
               SELECT SUM(pd.amount_due - pd.amount_paid) AS total_debt
               FROM payment_debts pd
               WHERE pd.student_id   = ge.student_id
                 AND pd.enrollment_id = ge.id
                 AND pd.status IN ('pending','partial','overdue')
                 AND pd.deleted_at IS NULL
             ) debt_stats ON TRUE
             WHERE ge.deleted_at IS NULL
               AND g.deleted_at IS NULL
               ${courseFilter}
             GROUP BY c.id, c.name, s.name
             ORDER BY c.name`,
      []
    );

    return rows.map(r => {
      const total = parseInt(r.total_enrolled as string, 10);
      const dropped = parseInt(r.dropped_count as string, 10);
      const churnRate = total > 0 ? parseFloat(((dropped / total) * 100).toFixed(2)) : 0;
      return {
        courseId: r.course_id as number,
        courseName: r.course_name as string,
        subjectName: r.subject_name as string,
        activeCount: parseInt(r.active_count as string, 10),
        inactiveCount: parseInt(r.inactive_count as string, 10),
        completedCount: parseInt(r.completed_count as string, 10),
        droppedCount: dropped,
        totalEnrolled: total,
        churnRate,
        avgAttendance: parseFloat((r.avg_attendance ?? '0') as string),
        avgDebt: parseFloat((r.avg_debt ?? '0') as string),
      };
    });
  }

  // ════════════════════════════════════════════════════════
  // 3. TEACHER PERFORMANCE
  // ════════════════════════════════════════════════════════

  async getTeacherPerformance(periodMonth: string): Promise<TeacherPerformance[]> {
    const monthStart = `${periodMonth}-01`;

    return query<TeacherPerformance>(
      `SELECT
               tp.id                                          AS "teacherId",
               u.first_name || ' ' || u.last_name            AS "teacherName",
               tp.specialization,
               COUNT(DISTINCT g.id)                          AS "groupCount",
               COUNT(DISTINCT ge.student_id)
                 FILTER (WHERE ge.status = 'active')          AS "totalStudents",
               COUNT(l.id)                                   AS "lessonsPlanned",
               COUNT(l.id) FILTER (WHERE l.status='completed') AS "lessonsConducted",
               ROUND(
                 COALESCE(
                   AVG(att_rate.rate) FILTER (WHERE att_rate.rate IS NOT NULL),
                   0
                 )::NUMERIC, 2
               )                                              AS "attendanceRate",
               COALESCE(SUM(p.amount), 0)                   AS "totalRevenue"
             FROM teacher_profiles tp
             JOIN users u ON u.id = tp.user_id
             LEFT JOIN groups g ON g.teacher_id = tp.id AND g.deleted_at IS NULL
             LEFT JOIN group_enrollments ge ON ge.group_id = g.id AND ge.deleted_at IS NULL
             LEFT JOIN lessons l ON l.group_id = g.id
               AND l.lesson_date >= $1::DATE
               AND l.lesson_date <  $1::DATE + INTERVAL '1 month'
               AND l.deleted_at IS NULL
             LEFT JOIN payments p ON p.enrollment_id = ge.id
               AND DATE_TRUNC('month', p.payment_date) = $1::DATE
               AND p.deleted_at IS NULL
             LEFT JOIN LATERAL (
               SELECT
                 CASE WHEN COUNT(sa.id) > 0
                   THEN COUNT(sa.id) FILTER (WHERE sa.status IN ('present','late'))::NUMERIC
                        / COUNT(sa.id) * 100
                   ELSE NULL
                 END AS rate
               FROM student_attendance sa
               JOIN lessons ll ON ll.id = sa.lesson_id
               WHERE ll.group_id = g.id
                 AND ll.lesson_date >= $1::DATE
                 AND ll.lesson_date <  $1::DATE + INTERVAL '1 month'
                 AND sa.deleted_at IS NULL
             ) att_rate ON TRUE
             WHERE tp.deleted_at IS NULL
               AND u.deleted_at IS NULL
             GROUP BY tp.id, u.first_name, u.last_name, tp.specialization
             ORDER BY "totalStudents" DESC`,
      [monthStart]
    );
  }

  // ════════════════════════════════════════════════════════
  // 4. MONTHLY TREND (so'nggi N oy)
  // ════════════════════════════════════════════════════════

  async getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
    return query<MonthlyTrend>(
      `WITH month_series AS (
               SELECT generate_series(
                 DATE_TRUNC('month', NOW()) - ($1 - 1) * INTERVAL '1 month',
                 DATE_TRUNC('month', NOW()),
                 INTERVAL '1 month'
               )::DATE AS month
             )
             SELECT
               TO_CHAR(ms.month, 'YYYY-MM') AS month,
               COALESCE(SUM(pd.amount_paid), 0)                      AS revenue,
               COALESCE((SELECT SUM(e.amount) FROM expenses e
                  WHERE DATE_TRUNC('month', e.expense_date) = ms.month
                    AND e.deleted_at IS NULL), 0)                     AS expenses,
               COALESCE(SUM(pd.amount_paid), 0) -
               COALESCE((SELECT SUM(e.amount) FROM expenses e
                  WHERE DATE_TRUNC('month', e.expense_date) = ms.month
                    AND e.deleted_at IS NULL), 0)                     AS "netProfit",
               COALESCE((SELECT COUNT(*) FROM users u
                  WHERE DATE_TRUNC('month', u.created_at) = ms.month
                    AND u.deleted_at IS NULL), 0)                     AS "newStudents",
               COALESCE((SELECT COUNT(DISTINCT ge.student_id)
                  FROM group_enrollments ge WHERE ge.status = 'active'
                    AND ge.deleted_at IS NULL), 0)                    AS "activeStudents"
             FROM month_series ms
             LEFT JOIN payment_debts pd
               ON pd.due_month    = ms.month AND pd.deleted_at IS NULL
             GROUP BY ms.month
             ORDER BY ms.month`,
      [months]
    );
  }

  // ════════════════════════════════════════════════════════
  // 5. FULL DEBTOR LIST (Export uchun — sahifalashsiz)
  // ════════════════════════════════════════════════════════

  async getAllDebtors(minDebt: number = 0): Promise<DebtorRecord[]> {
    return query<DebtorRecord>(
      `SELECT
               sp.id                                          AS "studentId",
               u.first_name || ' ' || u.last_name            AS "studentName",
               u.phone,
               u.email,
               SUM(pd.amount_due - pd.amount_paid)           AS "totalDebt",
               COUNT(*) FILTER (WHERE pd.status = 'overdue') AS "overdueMonths",
               MIN(pd.due_month)::TEXT                        AS "oldestDebtDate",
               ARRAY_AGG(DISTINCT g.name)                    AS groups,
               MAX(p.payment_date)::TEXT                      AS "lastPaymentDate"
             FROM payment_debts pd
             JOIN student_profiles sp ON sp.id = pd.student_id
             JOIN users u ON u.id = sp.user_id
             JOIN group_enrollments ge ON ge.id = pd.enrollment_id
             JOIN groups g ON g.id = ge.group_id
             LEFT JOIN payments p ON p.enrollment_id = ge.id AND p.deleted_at IS NULL
             WHERE pd.status IN ('pending','partial','overdue')
               AND pd.deleted_at IS NULL
               AND sp.deleted_at IS NULL
             GROUP BY sp.id, u.first_name, u.last_name, u.phone, u.email
             HAVING SUM(pd.amount_due - pd.amount_paid) > $1
             ORDER BY "totalDebt" DESC`,
      [minDebt]
    );
  }

  // ════════════════════════════════════════════════════════
  // 6. MONTHLY PAYMENT REPORT (Excel uchun to'liq ma'lumot)
  // ════════════════════════════════════════════════════════

  async getMonthlyPaymentReport(yearMonth: string): Promise<{
    studentName: string;
    phone: string;
    groupName: string;
    courseName: string;
    amountDue: number;
    amountPaid: number;
    balance: number;
    status: string;
    paymentDate: string | null;
  }[]> {
    const monthStart = `${yearMonth}-01`;
    return query(
      `SELECT
               u.first_name || ' ' || u.last_name AS "studentName",
               u.phone,
               g.name  AS "groupName",
               c.name  AS "courseName",
               pd.amount_due  AS "amountDue",
               pd.amount_paid AS "amountPaid",
               (pd.amount_due - pd.amount_paid) AS balance,
               pd.status,
               MAX(p.payment_date)::TEXT AS "paymentDate"
             FROM payment_debts pd
             JOIN student_profiles sp ON sp.id = pd.student_id
             JOIN users u ON u.id = sp.user_id
             JOIN group_enrollments ge ON ge.id = pd.enrollment_id
             JOIN groups g ON g.id = ge.group_id
             JOIN courses c ON c.id = g.course_id
             LEFT JOIN payments p ON p.enrollment_id = ge.id
               AND DATE_TRUNC('month', p.payment_date) = $1::DATE
               AND p.deleted_at IS NULL
             WHERE pd.due_month = $1::DATE AND pd.deleted_at IS NULL
             GROUP BY u.first_name, u.last_name, u.phone,
                      g.name, c.name, pd.amount_due, pd.amount_paid, pd.status
             ORDER BY u.last_name, u.first_name`,
      [monthStart]
    );
  }
}
