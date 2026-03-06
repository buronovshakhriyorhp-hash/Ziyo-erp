import { query } from '../config/database';

// ============================================================
// EXPENSE REPOSITORY
// Jadvalar: expenses, expense_categories
// ============================================================

export interface Expense {
    id: number;
    categoryId: number;
    categoryName: string;
    paymentMethodId: number | null;
    paymentMethod: string | null;
    paidBy: number | null;
    paidByName: string | null;
    approvedBy: number | null;
    approvedByName: string | null;
    amount: number;
    expenseDate: string;
    description: string | null;
    receiptUrl: string | null;
    createdAt: Date;
}

export interface CreateExpenseData {
    categoryId: number;
    paymentMethodId?: number | null;
    paidBy?: number | null;
    amount: number;
    expenseDate?: string;   // default: today
    description?: string | null;
    receiptUrl?: string | null;
    approvedBy?: number | null;
}

function mapExpense(r: Record<string, unknown>): Expense {
    return {
        id: r.id as number,
        categoryId: r.category_id as number,
        categoryName: r.category_name as string,
        paymentMethodId: r.payment_method_id as number | null,
        paymentMethod: r.payment_method as string | null,
        paidBy: r.paid_by as number | null,
        paidByName: r.paid_by_name as string | null,
        approvedBy: r.approved_by as number | null,
        approvedByName: r.approved_by_name as string | null,
        amount: parseFloat(r.amount as string),
        expenseDate: r.expense_date as string,
        description: r.description as string | null,
        receiptUrl: r.receipt_url as string | null,
        createdAt: new Date(r.created_at as string),
    };
}

const EXPENSE_SELECT = `
  SELECT
    e.id, e.category_id,
    ec.name                              AS category_name,
    e.payment_method_id,
    pm.name                              AS payment_method,
    e.paid_by,
    pu.first_name || ' ' || pu.last_name AS paid_by_name,
    e.approved_by,
    au.first_name || ' ' || au.last_name AS approved_by_name,
    e.amount, e.expense_date, e.description, e.receipt_url, e.created_at
  FROM expenses e
  JOIN expense_categories ec ON ec.id = e.category_id
  LEFT JOIN payment_methods pm ON pm.id = e.payment_method_id
  LEFT JOIN users pu ON pu.id = e.paid_by
  LEFT JOIN users au ON au.id = e.approved_by
  WHERE e.deleted_at IS NULL
`;

export class ExpenseRepository {

    async findAll(opts: {
        categoryId?: number;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Expense[]; total: number }> {
        const { categoryId, fromDate, toDate, limit = 20, offset = 0 } = opts;
        const cond: string[] = ['e.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (categoryId) { cond.push(`e.category_id   = $${i++}`); params.push(categoryId); }
        if (fromDate) { cond.push(`e.expense_date  >= $${i++}`); params.push(fromDate); }
        if (toDate) { cond.push(`e.expense_date  <= $${i++}`); params.push(toDate); }

        const where = cond.join(' AND ');
        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM expenses e WHERE ${where}`, params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `${EXPENSE_SELECT.replace('WHERE e.deleted_at IS NULL', `WHERE ${where}`)}
             ORDER BY e.expense_date DESC LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapExpense), total };
    }

    async findById(id: number): Promise<Expense | null> {
        const rows = await query<Record<string, unknown>>(
            `${EXPENSE_SELECT} AND e.id = $1`, [id]
        );
        return rows.length ? mapExpense(rows[0]) : null;
    }

    async create(data: CreateExpenseData): Promise<Expense> {
        const [row] = await query<{ id: number }>(
            `INSERT INTO expenses
               (category_id, payment_method_id, paid_by, amount,
                expense_date, description, receipt_url, approved_by)
             VALUES ($1,$2,$3,$4,$5::DATE,$6,$7,$8)
             RETURNING id`,
            [
                data.categoryId,
                data.paymentMethodId ?? null,
                data.paidBy ?? null,
                data.amount,
                data.expenseDate || new Date().toISOString().split('T')[0],
                data.description ?? null,
                data.receiptUrl ?? null,
                data.approvedBy ?? null,
            ]
        );
        return (await this.findById(row.id))!;
    }

    async update(id: number, data: Partial<CreateExpenseData>): Promise<Expense | null> {
        const set: string[] = [];
        const params: unknown[] = [];
        let i = 1;

        const map: Record<string, string> = {
            categoryId: 'category_id', paymentMethodId: 'payment_method_id',
            paidBy: 'paid_by', amount: 'amount', expenseDate: 'expense_date',
            description: 'description', receiptUrl: 'receipt_url', approvedBy: 'approved_by',
        };
        for (const [k, col] of Object.entries(map)) {
            if (k in data) {
                const cast = k === 'expenseDate' ? `$${i}::DATE` : `$${i}`;
                set.push(`${col} = ${cast}`);
                params.push((data as Record<string, unknown>)[k] ?? null);
                i++;
            }
        }
        if (!set.length) return this.findById(id);

        params.push(id);
        await query(
            `UPDATE expenses SET ${set.join(', ')} WHERE id = $${i} AND deleted_at IS NULL`,
            params
        );
        return this.findById(id);
    }

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE expenses SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    // Xarajatlarni toifa bo'yicha guruhlash (moliya xulosasi uchun)
    async getSummaryByCategory(fromDate: string, toDate: string): Promise<
        { categoryName: string; total: number; count: number }[]
    > {
        return query(
            `SELECT
               ec.name       AS "categoryName",
               SUM(e.amount) AS total,
               COUNT(*)      AS count
             FROM expenses e
             JOIN expense_categories ec ON ec.id = e.category_id
             WHERE e.deleted_at IS NULL
               AND e.expense_date BETWEEN $1::DATE AND $2::DATE
             GROUP BY ec.name
             ORDER BY SUM(e.amount) DESC`,
            [fromDate, toDate]
        );
    }

    async listCategories(): Promise<{ id: number; name: string; parentId: number | null }[]> {
        return query(
            `SELECT id, name, parent_id AS "parentId"
             FROM expense_categories
             WHERE deleted_at IS NULL
             ORDER BY name`
        );
    }
}
