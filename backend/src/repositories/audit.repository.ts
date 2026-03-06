import { query } from '../config/database';

// ============================================================
// AUDIT REPOSITORY
// Jadval: audit_logs
// Mas'uliyat: faqat DB bilan muloqot
// ============================================================

export interface AuditLog {
    id: number;
    tableName: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'READ';
    recordId: number | null;
    oldData: Record<string, unknown> | null;
    newData: Record<string, unknown> | null;
    changedBy: number | null;
    changedByName: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
}

export interface AuditLogFilter {
    tableName?: string;     // 'payments' | 'groups' | 'users'
    operation?: string;     // 'INSERT' | 'UPDATE' | 'DELETE' | 'READ'
    changedBy?: number;     // foydalanuvchi ID
    recordId?: number;      // qaysi yozuv
    fromDate?: string;      // YYYY-MM-DD
    toDate?: string;        // YYYY-MM-DD
    limit?: number;
    offset?: number;
}

export interface AuditStats {
    tableName: string;
    operation: string;
    count: number;
    lastOccurred: Date;
}

function mapRow(r: Record<string, unknown>): AuditLog {
    return {
        id: r.id as number,
        tableName: r.table_name as string,
        operation: r.operation as AuditLog['operation'],
        recordId: r.record_id as number | null,
        oldData: r.old_data as Record<string, unknown> | null,
        newData: r.new_data as Record<string, unknown> | null,
        changedBy: r.changed_by as number | null,
        changedByName: r.changed_by_name as string | null,
        ipAddress: r.ip_address as string | null,
        userAgent: r.user_agent as string | null,
        createdAt: new Date(r.created_at as string),
    };
}

export class AuditRepository {

    async findAll(filter: AuditLogFilter = {}): Promise<{ data: AuditLog[]; total: number }> {
        const {
            tableName, operation, changedBy, recordId,
            fromDate, toDate, limit = 50, offset = 0
        } = filter;

        const cond: string[] = ['1=1'];
        const params: unknown[] = [];
        let i = 1;

        if (tableName) { cond.push(`table_name = $${i++}`); params.push(tableName); }
        if (operation) { cond.push(`operation  = $${i++}`); params.push(operation.toUpperCase()); }
        if (changedBy) { cond.push(`changed_by = $${i++}`); params.push(changedBy); }
        if (recordId) { cond.push(`record_id  = $${i++}`); params.push(recordId); }
        if (fromDate) { cond.push(`created_at >= $${i++}::TIMESTAMPTZ`); params.push(fromDate); }
        if (toDate) { cond.push(`created_at <  ($${i++}::DATE + INTERVAL '1 day')`); params.push(toDate); }

        const where = cond.join(' AND ');

        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM audit_logs WHERE ${where}`,
            params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `SELECT id, table_name, operation, record_id,
                    old_data, new_data,
                    changed_by, changed_by_name,
                    ip_address, user_agent, created_at
             FROM audit_logs
             WHERE ${where}
             ORDER BY created_at DESC
             LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );

        return { data: rows.map(mapRow), total };
    }

    async getStats(): Promise<AuditStats[]> {
        const rows = await query<Record<string, unknown>>(
            `SELECT
                table_name,
                operation,
                COUNT(*)        AS count,
                MAX(created_at) AS last_occurred
             FROM audit_logs
             GROUP BY table_name, operation
             ORDER BY table_name, operation`
        );
        return rows.map(r => ({
            tableName: r.table_name as string,
            operation: r.operation as string,
            count: parseInt(r.count as string, 10),
            lastOccurred: new Date(r.last_occurred as string),
        }));
    }

    // Bitta yozuvning to'liq tarixini olish
    async findByRecord(tableName: string, recordId: number): Promise<AuditLog[]> {
        const rows = await query<Record<string, unknown>>(
            `SELECT * FROM audit_logs
             WHERE table_name = $1 AND record_id = $2
             ORDER BY created_at DESC`,
            [tableName, recordId]
        );
        return rows.map(mapRow);
    }

    // -- Nozik ma'lumotlarni o'qish (READ) logi --
    async logReadAccess(params: {
        tableName: string;
        recordId?: number;
        changedBy?: number | null;
        changedByName?: string | null;
        ipAddress?: string | null;
        userAgent?: string | null;
    }): Promise<void> {
        await query(
            `INSERT INTO audit_logs
            (table_name, operation, record_id, changed_by, changed_by_name, ip_address, user_agent)
            VALUES ($1, 'READ', $2, $3, $4, $5, $6)`,
            [
                params.tableName,
                params.recordId ?? null,
                params.changedBy ?? null,
                params.changedByName ?? null,
                params.ipAddress ?? null,
                params.userAgent ?? null
            ]
        );
    }
}
