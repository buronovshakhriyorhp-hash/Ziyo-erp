import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';
import { auditController } from '../controllers/audit.controller';

// ============================================================
// AUDIT ROUTES — Faqat ADMIN va MANAGER ko'ra oladi
// ============================================================

const router = Router();

// Barcha audit endpointlari himoyalangan
router.use(authenticate, authorize(...Roles.AUDIT_ACCESS));

// GET /api/audit/logs?table=payments&operation=INSERT&fromDate=2026-03-01
router.get('/logs', auditController.getLogs);

// GET /api/audit/stats — jadval/operatsiya bo'yicha statistika
router.get('/stats', auditController.getStats);

// GET /api/audit/history/:table/:recordId — bitta yozuvning to'liq tarixi
router.get('/history/:table/:recordId', auditController.getRecordHistory);

export default router;
