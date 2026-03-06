import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/api-response.util';

// ============================================================
// AUDIT CONTROLLER
// ============================================================

const auditService = new AuditService();

export const auditController = {

    /**
     * GET /api/audit/logs
     * Query params: table, operation, changedBy, recordId, fromDate, toDate, limit, offset
     */
    async getLogs(req: Request, res: Response): Promise<void> {
        const {
            table, operation, changedBy, recordId,
            fromDate, toDate, limit, offset
        } = req.query as Record<string, string | undefined>;

        const filter = {
            tableName: table,
            operation: operation?.toUpperCase(),
            changedBy: changedBy ? parseInt(changedBy, 10) : undefined,
            recordId: recordId ? parseInt(recordId, 10) : undefined,
            fromDate,
            toDate,
            limit: limit ? Math.min(parseInt(limit, 10), 200) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        };

        const result = await auditService.getLogs(filter);

        sendSuccess(res, {
            logs: result.data,
            total: result.total,
            limit: filter.limit,
            offset: filter.offset,
        }, 'Audit loglar muvaffaqiyatli olindi');
    },

    /**
     * GET /api/audit/stats
     * Jadval va operatsiya bo'yicha umumiy statistika
     */
    async getStats(_req: Request, res: Response): Promise<void> {
        const stats = await auditService.getStats();
        sendSuccess(res, { stats }, 'Statistika muvaffaqiyatli olindi');
    },

    /**
     * GET /api/audit/history/:table/:recordId
     * Bitta yozuvning to'liq o'zgarish tarixi
     */
    async getRecordHistory(req: Request, res: Response): Promise<void> {
        const { table, recordId } = req.params;
        const id = parseInt(recordId, 10);

        if (!id || isNaN(id)) {
            sendError(res, "recordId son bo'lishi kerak", 400, 'INVALID_PARAM');
            return;
        }

        const logs = await auditService.getRecordHistory(table, id);
        sendSuccess(res, { logs, total: logs.length }, `${table} #${id} tarixi`);
    },
};
