import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

const auditService = new AuditService();

/**
 * Audit O'qish (READ) operasiyalari uchun Middleware.
 * Maxfiy ma'lumotlar ro'yxati so'ralganda (GET) yoki o'qilganda log yozadi.
 * Asosan, Moliya, Oyliklar va Foydalanuvchi jadvallari uchun.
 */
export const auditReadLog = (tableName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Asinxron ravishda (Non-blocking) audit log yozamiz
            auditService.logReadAccess({
                tableName,
                recordId: req.params.id ? parseInt(req.params.id) : undefined,
                changedBy: req.user?.sub || null,
                changedByName: (req.user as any)?.firstName
                    ? `${(req.user as any).firstName} ${(req.user as any).lastName || ''}`.trim()
                    : 'Tizim / Ochiq',
                ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'] || 'unknown',
            }).catch(err => {
                console.error(`O'qish logida xato (${tableName}):`, err);
            });
        } catch (e) {
            // Ignore audit fails
            console.error(e);
        }

        // Asosiy so'rov davom etaveradi
        next();
    };
};
