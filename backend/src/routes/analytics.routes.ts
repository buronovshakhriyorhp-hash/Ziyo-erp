import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';

const analyticsRepo = new AnalyticsRepository();
const analyticsSvc = new AnalyticsService(analyticsRepo);
const analyticsCtrl = new AnalyticsController(analyticsSvc);

const router = Router();

// ══════════════════════════════════════════════════════════════
// ANALYTICS  →  /api/analytics
//    Barcha endpointlar faqat Admin/Manager uchun
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/analytics/financial?month=2026-03
 *
 * Ma'lum bir oy uchun moliyaviy xulosa:
 *   totalRevenue, totalExpenses, netProfit (Sof Foyda),
 *   profitMargin (%), collectionRate (%), pendingDebt,
 *   revenueBreakdown[], expenseBreakdown[]
 */
router.get(
    '/financial',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    analyticsCtrl.financialSummary
);

/**
 * GET /api/analytics/students?courseId=
 *
 * Kurs kesimida talabalar statistikasi:
 *   activeCount, droppedCount, churnRate (%),
 *   avgAttendance (%), avgDebt
 */
router.get(
    '/students',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    analyticsCtrl.studentStats
);

/**
 * GET /api/analytics/teachers?month=2026-03
 *
 * O'qituvchilar samaradorligi jadval:
 *   groupCount, totalStudents, lessonsPlanned/Conducted,
 *   attendanceRate, totalRevenue
 */
router.get(
    '/teachers',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    analyticsCtrl.teacherPerformance
);

/**
 * GET /api/analytics/trends?months=6
 *
 * So'nggi N oy bo'yicha oy-oy trend:
 *   revenue, expenses, netProfit, newStudents, activeStudents
 */
router.get(
    '/trends',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    analyticsCtrl.monthlyTrends
);

// ──────────────────────────────────────────────────────────────
// EXPORT ENDPOINTS
// ──────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/export/debtors?format=excel&minDebt=0
 *     /api/analytics/export/debtors?format=pdf&minDebt=100000
 *
 * Yuklab olish:
 *   • format=excel → .xlsx (rangdor jadval, katta qarzlar qizil)
 *   • format=pdf   → .pdf  (landscape A4, sahifalanadi)
 */
router.get(
    '/export/debtors',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    analyticsCtrl.exportDebtors
);

/**
 * GET /api/analytics/export/monthly?month=2026-03
 *
 * 2 varaqli Excel:
 *   Varaq 1: Moliyaviy Xulosa (P&L)
 *   Varaq 2: Har bir talaba to'lov holati
 */
router.get(
    '/export/monthly',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    analyticsCtrl.exportMonthlyReport
);

export default router;
