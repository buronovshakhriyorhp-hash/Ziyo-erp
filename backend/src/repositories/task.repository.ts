import { query } from '../config/database';

// ============================================================
// TASK REPOSITORY
// Jadval: tasks (CRM eslatmalari va vazifalar)
//
//   Ishlatiladi: Menejerlar lidad bo'yicha eslatma qo'yadi,
//   muddatini belgilaydi va bajarganini qayd etadi.
// ============================================================

export interface Task {
    id: number;
    leadId: number | null;
    leadName: string | null;
    leadPhone: string | null;
    assignedTo: number;
    assigneeName: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
    isOverdue: boolean;    // computed: dueDate past + not completed
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTaskData {
    leadId?: number | null;
    assignedTo: number;
    title: string;
    description?: string | null;
    dueDate?: string | null;   // ISO date string
}

function mapTask(r: Record<string, unknown>): Task {
    const dueDate = r.due_date ? new Date(r.due_date as string) : null;
    const isOverdue = !!(dueDate && dueDate < new Date() && !r.is_completed);
    return {
        id: r.id as number,
        leadId: r.lead_id as number | null,
        leadName: r.lead_name as string | null,
        leadPhone: r.lead_phone as string | null,
        assignedTo: r.assigned_to as number,
        assigneeName: r.assignee_name as string,
        title: r.title as string,
        description: r.description as string | null,
        dueDate,
        isCompleted: r.is_completed as boolean,
        completedAt: r.completed_at ? new Date(r.completed_at as string) : null,
        isOverdue,
        createdAt: new Date(r.created_at as string),
        updatedAt: new Date(r.updated_at as string),
    };
}

const TASK_SELECT = `
  SELECT
    t.id,
    t.lead_id,
    l.full_name                                 AS lead_name,
    l.phone                                     AS lead_phone,
    t.assigned_to,
    u.first_name || ' ' || u.last_name          AS assignee_name,
    t.title,
    t.description,
    t.due_date,
    t.is_completed,
    t.completed_at,
    t.created_at,
    t.updated_at
  FROM tasks t
  LEFT JOIN leads  l ON l.id = t.lead_id  AND l.deleted_at IS NULL
  JOIN  users  u ON u.id = t.assigned_to
  WHERE t.deleted_at IS NULL
`;

export class TaskRepository {

    async findById(id: number): Promise<Task | null> {
        const rows = await query<Record<string, unknown>>(
            `${TASK_SELECT} AND t.id = $1`, [id]
        );
        return rows.length ? mapTask(rows[0]) : null;
    }

    async findAll(opts: {
        assignedTo?: number;
        leadId?: number;
        isCompleted?: boolean;
        overdueOnly?: boolean;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Task[]; total: number }> {
        const { assignedTo, leadId, isCompleted, overdueOnly, search, limit = 20, offset = 0 } = opts;

        const cond: string[] = ['t.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (assignedTo !== undefined) { cond.push(`t.assigned_to  = $${i++}`); params.push(assignedTo); }
        if (leadId !== undefined) { cond.push(`t.lead_id      = $${i++}`); params.push(leadId); }
        if (isCompleted !== undefined) { cond.push(`t.is_completed = $${i++}`); params.push(isCompleted); }
        if (overdueOnly) {
            cond.push(`t.due_date < NOW() AND t.is_completed = FALSE`);
        }
        if (search?.trim()) {
            cond.push(`(t.title ILIKE $${i} OR l.full_name ILIKE $${i})`);
            params.push(`%${search.trim()}%`);
            i++;
        }

        const where = cond.join(' AND ');

        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM tasks t
             LEFT JOIN leads l ON l.id = t.lead_id AND l.deleted_at IS NULL
             WHERE ${where}`,
            params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `${TASK_SELECT.replace('WHERE t.deleted_at IS NULL', `WHERE ${where}`)}
             ORDER BY
               t.is_completed ASC,
               CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
               t.due_date ASC
             LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapTask), total };
    }

    async create(data: CreateTaskData): Promise<Task> {
        const [row] = await query<{ id: number }>(
            `INSERT INTO tasks (lead_id, assigned_to, title, description, due_date)
             VALUES ($1, $2, $3, $4, $5::TIMESTAMPTZ)
             RETURNING id`,
            [
                data.leadId ?? null,
                data.assignedTo,
                data.title,
                data.description ?? null,
                data.dueDate ?? null,
            ]
        );
        return (await this.findById(row.id))!;
    }

    async update(id: number, data: Partial<CreateTaskData>): Promise<Task | null> {
        const set: string[] = [];
        const params: unknown[] = [];
        let i = 1;

        if (data.title !== undefined) { set.push(`title       = $${i++}`); params.push(data.title); }
        if (data.description !== undefined) { set.push(`description = $${i++}`); params.push(data.description ?? null); }
        if (data.dueDate !== undefined) { set.push(`due_date    = $${i++}::TIMESTAMPTZ`); params.push(data.dueDate ?? null); }
        if (data.assignedTo !== undefined) { set.push(`assigned_to = $${i++}`); params.push(data.assignedTo); }
        if (data.leadId !== undefined) { set.push(`lead_id     = $${i++}`); params.push(data.leadId ?? null); }

        if (!set.length) return this.findById(id);

        params.push(id);
        await query(
            `UPDATE tasks SET ${set.join(', ')} WHERE id = $${i} AND deleted_at IS NULL`,
            params
        );
        return this.findById(id);
    }

    /**
     * Vazifani bajarilgan deb belgilash.
     * completed_at = NOW(), is_completed = TRUE
     */
    async markComplete(id: number): Promise<Task | null> {
        await query(
            `UPDATE tasks
             SET is_completed = TRUE, completed_at = NOW()
             WHERE id = $1 AND is_completed = FALSE AND deleted_at IS NULL`,
            [id]
        );
        return this.findById(id);
    }

    /**
     * Vazifani qayta ochish (bajarilmagan holatga qaytarish).
     */
    async reopen(id: number): Promise<Task | null> {
        await query(
            `UPDATE tasks
             SET is_completed = FALSE, completed_at = NULL
             WHERE id = $1 AND is_completed = TRUE AND deleted_at IS NULL`,
            [id]
        );
        return this.findById(id);
    }

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE tasks SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    /**
     * Bugun muddati tugaydigan yoki o'tib ketgan vazifalar
     * (dashboard notification uchun)
     */
    async findOverdueSummary(): Promise<{
        userId: number;
        assigneeName: string;
        overdueCount: number;
        dueTodayCount: number;
    }[]> {
        return query(
            `SELECT
               t.assigned_to       AS "userId",
               u.first_name || ' ' || u.last_name AS "assigneeName",
               COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE)  AS "overdueCount",
               COUNT(*) FILTER (WHERE t.due_date::DATE = CURRENT_DATE) AS "dueTodayCount"
             FROM tasks t
             JOIN users u ON u.id = t.assigned_to
             WHERE t.is_completed = FALSE
               AND t.deleted_at IS NULL
               AND t.due_date IS NOT NULL
               AND t.due_date <= CURRENT_DATE + INTERVAL '1 day'
             GROUP BY t.assigned_to, u.first_name, u.last_name
             ORDER BY "overdueCount" DESC`
        );
    }
}
