import { AuditRepository, AuditLogFilter } from '../repositories/audit.repository';

// ============================================================
// AUDIT SERVICE
// Biznes mantiq qatlami
// ============================================================

const auditRepo = new AuditRepository();

export class AuditService {

    async getLogs(filter: AuditLogFilter) {
        return auditRepo.findAll(filter);
    }

    async getStats() {
        return auditRepo.getStats();
    }

    async getRecordHistory(tableName: string, recordId: number) {
        const validTables = ['payments', 'groups', 'users'];
        if (!validTables.includes(tableName)) {
            throw Object.assign(new Error(`Noto'g'ri jadval nomi: ${tableName}`), { statusCode: 400 });
        }
        return auditRepo.findByRecord(tableName, recordId);
    }

    async logReadAccess(params: {
        tableName: string;
        recordId?: number;
        changedBy?: number | null;
        changedByName?: string | null;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        return auditRepo.logReadAccess(params);
    }
}
