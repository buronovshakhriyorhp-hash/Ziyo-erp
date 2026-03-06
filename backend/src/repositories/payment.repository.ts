import { PoolClient } from 'pg';
import { query, withTransaction, withAuditContext } from '../config/database';

// ============================================================
// PAYMENT REPOSITORY
// Jadvalar: payments, payment_debts, group_enrollments
// ============================================================

export interface Payment {
    id: number;
    enrollmentId: number;
    studentId: number;
    studentName: string;
    groupName: string;
    courseName: string;
    paymentMethodId: number;
    paymentMethod: string;
    receivedBy: number;
    receivedByName: string;
    amount: number;
    paymentDate: string;
    paymentMonth: string;
    description: string | null;
    receiptNumber: string | null;
    createdAt: Date;
}

export interface CreatePaymentData {
    enrollmentId: number;
    studentId: number;
    paymentMethodId: number;
    receivedBy: number;
    amount: number;
    paymentDate?: string;  // YYYY-MM-DD, default: today
    paymentMonth: string;  // YYYY-MM-DD (oyning 1-kuni)
    description?: string | null;
    receiptNumber?: string | null;
}

export interface Debt {
    id: number;
    enrollmentId: number;
    studentId: number;
    studentName: string;
    groupName: string;
    dueMonth: string;
    amountDue: number;
    amountPaid: number;
    remaining: number;
    dueDate: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
}

function mapPayment(r: Record<string, unknown>): Payment {
    return {
        id: r.id as number,
        enrollmentId: r.enrollment_id as number,
        studentId: r.student_id as number,
        studentName: r.student_name as string,
        groupName: r.group_name as string,
        courseName: r.course_name as string,
        paymentMethodId: r.payment_method_id as number,
        paymentMethod: r.payment_method as string,
        receivedBy: r.received_by as number,
        receivedByName: r.received_by_name as string,
        amount: parseFloat(r.amount as string),
        paymentDate: r.payment_date as string,
        paymentMonth: r.payment_month as string,
        description: r.description as string | null,
        receiptNumber: r.receipt_number as string | null,
        createdAt: new Date(r.created_at as string),
    };
}

function mapDebt(r: Record<string, unknown>): Debt {
    return {
        id: r.id as number,
        enrollmentId: r.enrollment_id as number,
        studentId: r.student_id as number,
        studentName: r.student_name as string,
        groupName: r.group_name as string,
        dueMonth: r.due_month as string,
        amountDue: parseFloat(r.amount_due as string),
        amountPaid: parseFloat(r.amount_paid as string),
        remaining: parseFloat(r.remaining as string),
        dueDate: r.due_date as string,
        status: r.status as Debt['status'],
    };
}

const PAYMENT_SELECT = `
  SELECT
    p.id, p.enrollment_id, p.student_id,
    u.first_name || ' ' || u.last_name  AS student_name,
    g.name                              AS group_name,
    c.name                              AS course_name,
    p.payment_method_id,
    pm.name                             AS payment_method,
    p.received_by,
    ru.first_name || ' ' || ru.last_name AS received_by_name,
    p.amount, p.payment_date, p.payment_month,
    p.description, p.receipt_number, p.created_at
  FROM payments p
  JOIN student_profiles sp ON sp.id = p.student_id
  JOIN users u  ON u.id  = sp.user_id
  JOIN group_enrollments ge ON ge.id = p.enrollment_id
  JOIN groups g  ON g.id  = ge.group_id
  JOIN courses c ON c.id  = g.course_id
  JOIN payment_methods pm ON pm.id = p.payment_method_id
  JOIN users ru ON ru.id = p.received_by
  WHERE p.deleted_at IS NULL
`;

export class PaymentRepository {

    // ── To'lovlar ─────────────────────────────────────────────

    async findAll(opts: {
        studentId?: number;
        groupId?: number;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Payment[]; total: number }> {
        const { studentId, groupId, fromDate, toDate, limit = 20, offset = 0 } = opts;
        const cond: string[] = ['p.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (studentId) { cond.push(`p.student_id  = $${i++}`); params.push(studentId); }
        if (groupId) { cond.push(`ge.group_id   = $${i++}`); params.push(groupId); }
        if (fromDate) { cond.push(`p.payment_date >= $${i++}`); params.push(fromDate); }
        if (toDate) { cond.push(`p.payment_date <= $${i++}`); params.push(toDate); }

        const where = cond.join(' AND ');

        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM payments p
             JOIN group_enrollments ge ON ge.id = p.enrollment_id
             WHERE ${where}`, params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `${PAYMENT_SELECT.replace('WHERE p.deleted_at IS NULL', `WHERE ${where}`)}
             ORDER BY p.payment_date DESC LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapPayment), total };
    }

    async findById(id: number): Promise<Payment | null> {
        const rows = await query<Record<string, unknown>>(
            `${PAYMENT_SELECT} AND p.id = $1`, [id]
        );
        return rows.length ? mapPayment(rows[0]) : null;
    }

    /**
     * Yangi To'lovni saqlash + Qarzlarni kaskad tartibida yopib chiqish (ATOMIC).
     *
     * Mantiq:
     *  1. payments jadvaliga yangi yozuv qo'sh.
     *  2. Shu o'quvchining (enrollment emas, umumiy student) barcha to'lanmagan qarzlari 
     *     oyma-oy eng eskisidan tortib ro'yxatga olinadi (ORDER BY due_date ASC FOR UPDATE).
     *  3. To'lov summasi ketma-ket qarzni yopib chiqadi.
     */
    async createWithCascadingDebtUpdate(
        data: CreatePaymentData,
        reqContext: { managerId: number; managerName: string; ip: string; ua: string }
    ): Promise<{ payment: Payment; debtUpdated: boolean }> {
        return withAuditContext(
            reqContext.managerId,
            reqContext.managerName,
            reqContext.ip,
            reqContext.ua,
            async (client: PoolClient) => {
                await client.query('SET search_path = erp');

                // 1. To'lovni yozish
                const { rows: [payRow] } = await client.query(
                    `INSERT INTO payments
                   (enrollment_id, student_id, payment_method_id, received_by,
                    amount, payment_date, payment_month, description, receipt_number)
                 VALUES ($1,$2,$3,$4,$5,$6::DATE,$7::DATE,$8,$9)
                 RETURNING id`,
                    [
                        data.enrollmentId, data.studentId, data.paymentMethodId,
                        data.receivedBy, data.amount,
                        data.paymentDate || new Date().toISOString().split('T')[0],
                        data.paymentMonth,
                        data.description ?? null,
                        data.receiptNumber ?? null,
                    ]
                );
                const paymentId: number = payRow.id;

                // 2. O'quvchining barcha ochiq qarzlarini eng eskisidan boshlab izlaymiz
                const { rows: debtRows } = await client.query(
                    `SELECT id, amount_due, amount_paid
                 FROM payment_debts
                 WHERE student_id = $1
                   AND status IN ('pending', 'partial', 'overdue')
                   AND deleted_at IS NULL
                 ORDER BY due_date ASC
                 FOR UPDATE`,           // row-level lock
                    [data.studentId]
                );

                let remainingPaymentAmount = data.amount;
                let debtUpdated = false;

                // Kaskad tizimi: pulni eskisidan yangisiga taqsimlab ketaveramiz
                for (const debt of debtRows) {
                    if (remainingPaymentAmount <= 0) break;

                    const dbAmountDue = parseFloat(debt.amount_due);
                    const dbAmountPaid = parseFloat(debt.amount_paid);
                    const currentDebtRemaining = dbAmountDue - dbAmountPaid;

                    if (currentDebtRemaining > 0) {
                        const amountToApplyToThisDebt = Math.min(remainingPaymentAmount, currentDebtRemaining);
                        const newPaid = dbAmountPaid + amountToApplyToThisDebt;

                        const newStatus = newPaid >= dbAmountDue
                            ? 'paid'
                            : newPaid > 0 ? 'partial' : 'pending';

                        await client.query(
                            `UPDATE payment_debts
                         SET amount_paid = $1, status = $2, updated_at = NOW()
                         WHERE id = $3`,
                            [newPaid, newStatus, debt.id]
                        );

                        remainingPaymentAmount -= amountToApplyToThisDebt;
                        debtUpdated = true;
                    }
                }

                const payment = await this.findById(paymentId);
                return { payment: payment!, debtUpdated };
            });
    }

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE payments SET deleted_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL`, [id]
        );
    }

    // ── Qarzlar ───────────────────────────────────────────────

    async findDebts(opts: {
        studentId?: number;
        enrollmentId?: number;
        status?: string;
        overdueOnly?: boolean;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Debt[]; total: number }> {
        const { studentId, enrollmentId, status, overdueOnly, limit = 20, offset = 0 } = opts;
        const cond: string[] = ['pd.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (studentId) { cond.push(`pd.student_id    = $${i++}`); params.push(studentId); }
        if (enrollmentId) { cond.push(`pd.enrollment_id = $${i++}`); params.push(enrollmentId); }
        if (status) { cond.push(`pd.status        = $${i++}`); params.push(status); }
        if (overdueOnly) { cond.push(`pd.due_date < CURRENT_DATE AND pd.status != 'paid'`); }

        const where = cond.join(' AND ');
        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM payment_debts pd WHERE ${where}`, params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `SELECT
               pd.id, pd.enrollment_id, pd.student_id,
               u.first_name || ' ' || u.last_name AS student_name,
               g.name AS group_name,
               pd.due_month, pd.amount_due, pd.amount_paid,
               pd.amount_due - pd.amount_paid AS remaining,
               pd.due_date, pd.status
             FROM payment_debts pd
             JOIN student_profiles sp ON sp.id = pd.student_id
             JOIN users u ON u.id = sp.user_id
             JOIN group_enrollments ge ON ge.id = pd.enrollment_id
             JOIN groups g ON g.id = ge.group_id
             WHERE ${where}
             ORDER BY pd.due_date ASC
             LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapDebt), total };
    }

    // Talabaning umumiy balansini hisoblash
    async getStudentBalance(studentId: number): Promise<{
        totalPaid: number;
        totalDebt: number;
        balance: number;
    }> {
        const [paidRow] = await query<{ total: string }>(
            `SELECT COALESCE(SUM(amount), 0) AS total
             FROM payments WHERE student_id = $1 AND deleted_at IS NULL`,
            [studentId]
        );
        const [debtRow] = await query<{ total: string }>(
            `SELECT COALESCE(SUM(amount_due - amount_paid), 0) AS total
             FROM payment_debts
             WHERE student_id = $1
               AND status IN ('pending','partial','overdue')
               AND deleted_at IS NULL`,
            [studentId]
        );
        const totalPaid = parseFloat(paidRow?.total ?? '0');
        const totalDebt = parseFloat(debtRow?.total ?? '0');
        return { totalPaid, totalDebt, balance: totalPaid - totalDebt };
    }

    // ── Muddati o'tgan qarzlarni belgilash ───────────────────
    /**
     * due_date < TODAY va status IN ('pending','partial') bo'lgan barcha
     * payment_debts yozuvlarini 'overdue' ga o'tkazadi.
     *
     * Odatda bir kecha bir marta (cron) yoki admin so'rovida ishlatiladi.
     */
    async markOverdueDebts(): Promise<{ updated: number }> {
        const result = await query<{ count: string }>(
            `WITH updated AS (
               UPDATE payment_debts
               SET status = 'overdue', updated_at = NOW()
               WHERE due_date < CURRENT_DATE
                 AND status IN ('pending','partial')
                 AND deleted_at IS NULL
               RETURNING id
             )
             SELECT COUNT(*) AS count FROM updated`,
            []
        );
        return { updated: parseInt(result[0]?.count ?? '0', 10) };
    }

    // ── To'lovni bekor qilish + qarzni qaytarish (ATOMIC) ────
    /**
     * To'lov soft-delete qilinadi va unga bog'liq payment_debts.amount_paid
     * kamaytirilib, status qayta hisoblanadi.
     */
    async cancelPaymentWithDebtRollback(paymentId: number): Promise<void> {
        await withTransaction(async (client: PoolClient) => {
            await client.query('SET search_path = erp');

            // 1. To'lovni topib, ma'lumotlarini olish
            const { rows: [pay] } = await client.query(
                `SELECT enrollment_id, student_id, amount, payment_month
                 FROM payments
                 WHERE id = $1 AND deleted_at IS NULL
                 FOR UPDATE`,
                [paymentId]
            );
            if (!pay) throw new Error('To\'lov topilmadi yoki allaqachon bekor qilingan');

            // 2. Soft-delete
            await client.query(
                `UPDATE payments SET deleted_at = NOW() WHERE id = $1`,
                [paymentId]
            );

            // 3. Shu oy uchun qarzni topib, amount_paid ni kamaytirish
            const { rows: [debt] } = await client.query(
                `SELECT id, amount_due, amount_paid
                 FROM payment_debts
                 WHERE enrollment_id = $1
                   AND due_month     = $2::DATE
                   AND deleted_at IS NULL
                 FOR UPDATE`,
                [pay.enrollment_id, pay.payment_month]
            );

            if (debt) {
                const newPaid = Math.max(0, parseFloat(debt.amount_paid) - parseFloat(pay.amount));
                const amountDue = parseFloat(debt.amount_due);
                const newStatus = newPaid >= amountDue
                    ? 'paid'
                    : newPaid > 0 ? 'partial' : 'pending';

                await client.query(
                    `UPDATE payment_debts
                     SET amount_paid = $1, status = $2, updated_at = NOW()
                     WHERE id = $3`,
                    [newPaid.toFixed(2), newStatus, debt.id]
                );
            }
        });
    }
}
