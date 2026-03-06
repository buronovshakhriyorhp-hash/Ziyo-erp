import { query, withTransaction } from '../config/database';

// ============================================================
// LEAD REPOSITORY
// Mas'uliyat: leads, call_logs, tasks jadvallari bilan muloqot.
//   Asosiy murakkablik: Lead → Student konversiya (tranzaksiya)
// ============================================================

export interface Lead {
    id: number;
    fullName: string;
    phone: string;
    email: string | null;
    sourceId: number | null;
    sourceName: string | null;
    statusId: number;
    statusName: string;
    statusColor: string | null;
    assignedTo: number | null;
    assignedName: string | null;
    courseInterest: string | null;
    notes: string | null;
    convertedAt: Date | null;
    studentId: number | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface CallLog {
    id: number;
    leadId: number | null;
    calledBy: number;
    callerName: string;
    callDatetime: Date;
    durationSec: number;
    callType: 'inbound' | 'outbound';
    result: string | null;
    nextCallAt: Date | null;
    notes: string | null;
    createdAt: Date;
}

export interface CreateLeadData {
    fullName: string;
    phone: string;
    email?: string | null;
    sourceId?: number | null;
    statusId: number;
    assignedTo?: number | null;
    courseInterest?: string | null;
    notes?: string | null;
}

export interface CreateCallLogData {
    leadId: number;
    calledBy: number;
    durationSec?: number;
    callType?: 'inbound' | 'outbound';
    result?: string | null;
    nextCallAt?: string | null;
    notes?: string | null;
}

// ──────────────────────────────────────────────────────────────
// MAPPERS
// ──────────────────────────────────────────────────────────────

function mapLead(row: Record<string, unknown>): Lead {
    return {
        id: row.id as number,
        fullName: row.full_name as string,
        phone: row.phone as string,
        email: row.email as string | null,
        sourceId: row.source_id as number | null,
        sourceName: row.source_name as string | null,
        statusId: row.status_id as number,
        statusName: row.status_name as string,
        statusColor: row.status_color as string | null,
        assignedTo: row.assigned_to as number | null,
        assignedName: row.assigned_name as string | null,
        courseInterest: row.course_interest as string | null,
        notes: row.notes as string | null,
        convertedAt: row.converted_at ? new Date(row.converted_at as string) : null,
        studentId: row.student_id as number | null,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    };
}

function mapCallLog(row: Record<string, unknown>): CallLog {
    return {
        id: row.id as number,
        leadId: row.lead_id as number | null,
        calledBy: row.called_by as number,
        callerName: row.caller_name as string,
        callDatetime: new Date(row.call_datetime as string),
        durationSec: row.duration_sec as number,
        callType: row.call_type as 'inbound' | 'outbound',
        result: row.result as string | null,
        nextCallAt: row.next_call_at ? new Date(row.next_call_at as string) : null,
        notes: row.notes as string | null,
        createdAt: new Date(row.created_at as string),
    };
}

const LEAD_SELECT = `
  SELECT
    l.id,
    l.full_name,
    l.phone,
    l.email,
    l.source_id,
    ls.name          AS source_name,
    l.status_id,
    lst.name         AS status_name,
    lst.color        AS status_color,
    l.assigned_to,
    (u.first_name || ' ' || u.last_name) AS assigned_name,
    l.course_interest,
    l.notes,
    l.converted_at,
    l.student_id,
    l.created_at,
    l.updated_at,
    l.deleted_at
  FROM leads l
  LEFT JOIN lead_sources  ls  ON ls.id  = l.source_id
  LEFT JOIN lead_statuses lst ON lst.id = l.status_id
  LEFT JOIN users         u   ON u.id   = l.assigned_to
  WHERE l.deleted_at IS NULL
`;

// ──────────────────────────────────────────────────────────────
// REPOSITORY
// ──────────────────────────────────────────────────────────────

export class LeadRepository {

    // ════════════════════════════════════════════════════════
    // O'QISH
    // ════════════════════════════════════════════════════════

    async findById(id: number): Promise<Lead | null> {
        const rows = await query<Record<string, unknown>>(
            `${LEAD_SELECT} AND l.id = $1`, [id]
        );
        return rows.length ? mapLead(rows[0]) : null;
    }

    async findAll(options: {
        statusId?: number;
        assignedTo?: number;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Lead[]; total: number }> {
        const { statusId, assignedTo, search, limit = 20, offset = 0 } = options;

        const conditions: string[] = ['l.deleted_at IS NULL'];
        const params: unknown[] = [];
        let idx = 1;

        if (statusId) { conditions.push(`l.status_id   = $${idx++}`); params.push(statusId); }
        if (assignedTo) { conditions.push(`l.assigned_to = $${idx++}`); params.push(assignedTo); }
        if (search?.trim()) {
            conditions.push(`(l.full_name ILIKE $${idx} OR l.phone ILIKE $${idx})`);
            params.push(`%${search.trim()}%`);
            idx++;
        }

        const where = conditions.join(' AND ');

        const [countRow] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM leads l WHERE ${where}`, params
        );
        const total = parseInt(countRow?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `${LEAD_SELECT.replace('WHERE l.deleted_at IS NULL', `WHERE ${where}`)}
             ORDER BY l.created_at DESC
             LIMIT $${idx++} OFFSET $${idx}`,
            [...params, limit, offset]
        );

        return { data: rows.map(mapLead), total };
    }

    async findByPhone(phone: string): Promise<Lead | null> {
        const rows = await query<Record<string, unknown>>(
            `${LEAD_SELECT} AND l.phone = $1`, [phone]
        );
        return rows.length ? mapLead(rows[0]) : null;
    }

    // ════════════════════════════════════════════════════════
    // YARATISH
    // ════════════════════════════════════════════════════════

    async create(data: CreateLeadData): Promise<Lead> {
        const rows = await query<Record<string, unknown>>(
            `INSERT INTO leads
               (full_name, phone, email, source_id, status_id,
                assigned_to, course_interest, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id`,
            [
                data.fullName, data.phone,
                data.email ?? null,
                data.sourceId ?? null,
                data.statusId,
                data.assignedTo ?? null,
                data.courseInterest ?? null,
                data.notes ?? null,
            ]
        );
        return (await this.findById((rows[0]).id as number))!;
    }

    // ════════════════════════════════════════════════════════
    // YANGILASH
    // ════════════════════════════════════════════════════════

    async update(
        id: number,
        data: Partial<CreateLeadData & { studentId: number; convertedAt: string }>
    ): Promise<Lead | null> {
        const set: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        const map: Record<string, string> = {
            fullName: 'full_name',
            phone: 'phone',
            email: 'email',
            sourceId: 'source_id',
            statusId: 'status_id',
            assignedTo: 'assigned_to',
            courseInterest: 'course_interest',
            notes: 'notes',
            studentId: 'student_id',
            convertedAt: 'converted_at',
        };

        for (const [k, col] of Object.entries(map)) {
            if (k in data) {
                set.push(`${col} = $${idx++}`);
                params.push((data as Record<string, unknown>)[k]);
            }
        }

        if (!set.length) return this.findById(id);

        params.push(id);
        await query(
            `UPDATE leads SET ${set.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`,
            params
        );
        return this.findById(id);
    }

    // ════════════════════════════════════════════════════════
    // QO'NG'IROQ TARIXI
    // ════════════════════════════════════════════════════════

    async addCallLog(data: CreateCallLogData): Promise<CallLog> {
        const rows = await query<Record<string, unknown>>(
            `INSERT INTO call_logs
               (lead_id, called_by, duration_sec, call_type, result, next_call_at, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING
               id, lead_id, called_by,
               (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.id = $2) AS caller_name,
               call_datetime, duration_sec, call_type, result, next_call_at, notes, created_at`,
            [
                data.leadId, data.calledBy,
                data.durationSec ?? 0,
                data.callType ?? 'outbound',
                data.result ?? null,
                data.nextCallAt ?? null,
                data.notes ?? null,
            ]
        );
        return mapCallLog(rows[0]);
    }

    async getCallLogs(leadId: number): Promise<CallLog[]> {
        const rows = await query<Record<string, unknown>>(
            `SELECT
               cl.id, cl.lead_id, cl.called_by,
               u.first_name || ' ' || u.last_name AS caller_name,
               cl.call_datetime, cl.duration_sec, cl.call_type,
               cl.result, cl.next_call_at, cl.notes, cl.created_at
             FROM call_logs cl
             JOIN users u ON u.id = cl.called_by
             WHERE cl.lead_id = $1 AND cl.deleted_at IS NULL
             ORDER BY cl.call_datetime DESC`,
            [leadId]
        );
        return rows.map(mapCallLog);
    }

    // ════════════════════════════════════════════════════════
    // GLOBAL QO'NG'IROQLAR RO'YXATI
    // ════════════════════════════════════════════════════════

    /**
     * Barcha qo'ng'iroqlar (filter + pagination).
     * Menejer dashboardi uchun — kim, qachon, qaysi lidga qo'ng'iroq qildi.
     */
    async getAllCallLogs(opts: {
        calledBy?: number;
        leadId?: number;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: CallLog[]; total: number }> {
        const { calledBy, leadId, fromDate, toDate, limit = 20, offset = 0 } = opts;

        const cond: string[] = ['cl.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (calledBy) { cond.push(`cl.called_by  = $${i++}`); params.push(calledBy); }
        if (leadId) { cond.push(`cl.lead_id    = $${i++}`); params.push(leadId); }
        if (fromDate) { cond.push(`cl.call_datetime >= $${i++}::TIMESTAMPTZ`); params.push(fromDate); }
        if (toDate) { cond.push(`cl.call_datetime <= $${i++}::TIMESTAMPTZ`); params.push(toDate); }

        const where = cond.join(' AND ');

        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM call_logs cl
             WHERE ${where}`,
            params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `SELECT
               cl.id, cl.lead_id, cl.called_by,
               u.first_name || ' ' || u.last_name AS caller_name,
               cl.call_datetime, cl.duration_sec, cl.call_type,
               cl.result, cl.next_call_at, cl.notes, cl.created_at
             FROM call_logs cl
             JOIN users u ON u.id = cl.called_by
             WHERE ${where}
             ORDER BY cl.call_datetime DESC
             LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapCallLog), total };
    }

    /**
     * Kelajakda rejalashtirilgan qo'ng'iroqlar (next_call_at bo'yicha).
     * Menejerga eslatma sifatida: kim, qachon qo'ng'iroq qilishi kerak.
     */
    async getUpcomingCalls(opts: {
        calledBy?: number;
        limit?: number;
    } = {}): Promise<CallLog[]> {
        const { calledBy, limit = 50 } = opts;

        const cond: string[] = [
            'cl.deleted_at IS NULL',
            'cl.next_call_at IS NOT NULL',
            'cl.next_call_at >= NOW()',
        ];
        const params: unknown[] = [];
        let i = 1;

        if (calledBy) { cond.push(`cl.called_by = $${i++}`); params.push(calledBy); }

        const where = cond.join(' AND ');

        const rows = await query<Record<string, unknown>>(
            `SELECT
               cl.id, cl.lead_id, cl.called_by,
               u.first_name || ' ' || u.last_name AS caller_name,
               cl.call_datetime, cl.duration_sec, cl.call_type,
               cl.result, cl.next_call_at, cl.notes, cl.created_at
             FROM call_logs cl
             JOIN users u ON u.id = cl.called_by
             WHERE ${where}
             ORDER BY cl.next_call_at ASC
             LIMIT $${i}`,
            [...params, limit]
        );
        return rows.map(mapCallLog);
    }

    // ════════════════════════════════════════════════════════
    // SOFT DELETE
    // ════════════════════════════════════════════════════════

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE leads SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    async softDeleteCallLog(id: number): Promise<void> {
        await query(
            `UPDATE call_logs SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
