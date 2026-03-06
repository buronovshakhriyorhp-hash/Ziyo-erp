import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';

const attRepo = new AttendanceRepository();
const attSvc = new AttendanceService(attRepo);
const attCtrl = new AttendanceController(attSvc);

const router = Router();

// ══════════════════════════════════════════════════════════════
// DAVOMAT  →  /api/attendance
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/attendance/mark
 *
 * ⚡ ATOMIC TRANSACTION — Bir so'rovda:
 *   1. student_attendance UPSERT (barcha talabalar)
 *   2. teacher_attendance UPSERT
 *   3. lessons.status = 'completed'
 *   4. present/late → payment_debts ga dars haqqi qo'shiladi
 *   5. Qarz muddati o'tgan bo'lsa → status = 'overdue'
 *
 * Body:
 * {
 *   "lessonId": 1,
 *   "teacherStatus": "present",
 *   "students": [
 *     { "studentId": 5, "status": "present" },
 *     { "studentId": 6, "status": "absent" },
 *     { "studentId": 7, "status": "late", "lateMinutes": 10 }
 *   ]
 * }
 */
router.post(
    '/mark',
    authenticate,
    authorize('admin', 'manager', 'teacher'),
    attCtrl.mark
);

/** GET /api/attendance/lesson/:lessonId — Bir dars davomati */
router.get(
    '/lesson/:lessonId',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    attCtrl.getByLesson
);

/**
 * GET /api/attendance/student/:studentId?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Talabaning davomat tarixi
 */
router.get(
    '/student/:studentId',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    attCtrl.getByStudent
);

/**
 * GET /api/attendance/debtors?minDebt=50000&page=1
 *
 * Qarzdor talabalar ro'yxati.
 * Har bir talaba uchun: totalDebt, overdueMonths, groups[]
 * Dashboard va SMS eslatma uchun ishlatiladi.
 */
router.get(
    '/debtors',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    attCtrl.getDebtors
);

export default router;
