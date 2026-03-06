import express from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { churnDetectionService } from '../services/churn-detection.service';
import { sendSuccess } from '../utils/api-response.util';

const router = express.Router();
router.use(authenticate);

// ── AI Churn Detection ─────────────────────────────────────
/** GET /api/ai/churn/risk — Butun markaz bo'yicha risk talabalar */
router.get('/churn/risk', authorize('admin', 'manager'), async (_req, res) => {
    const students = await churnDetectionService.getHighRiskStudents(50);
    sendSuccess(res, students, 'Yuqori risk talabalar ro\'yxati');
});

/** GET /api/ai/churn/stats — Umumiy statistika */
router.get('/churn/stats', authorize('admin', 'manager'), async (_req, res) => {
    const stats = await churnDetectionService.getSummaryStats();
    sendSuccess(res, stats, 'Churn statistikasi');
});

/** GET /api/ai/churn/group/:groupId — Guruh bo'yicha tahlil */
router.get('/churn/group/:groupId', authorize('admin', 'manager', 'teacher'), async (req, res) => {
    const results = await churnDetectionService.analyzeGroup(parseInt(req.params.groupId));
    sendSuccess(res, results, 'Guruh churn tahlili');
});

export default router;
