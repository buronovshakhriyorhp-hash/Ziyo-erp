import { Router } from 'express';

// ── Controllers ───────────────────────────────────────────────
import { CourseController } from '../controllers/course.controller';
import { GroupController } from '../controllers/group.controller';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { LessonController } from '../controllers/lesson.controller';

// ── Services ─────────────────────────────────────────────────
import { CourseService } from '../services/course.service';
import { GroupService } from '../services/group.service';
import { EnrollmentService } from '../services/enrollment.service';
import { LessonService } from '../services/lesson.service';

// ── Repositories ──────────────────────────────────────────────
import { CourseRepository } from '../repositories/course.repository';
import { GroupRepository } from '../repositories/group.repository';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { LessonRepository } from '../repositories/lesson.repository';
import { PaymentRepository } from '../repositories/payment.repository';

// ── Middlewares ───────────────────────────────────────────────
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';
import {
    validate,
    idParamSchema,
    paginationSchema,
    createCourseSchema,
    createGroupSchema,
    createEnrollmentSchema,
    createLessonSchema
} from '../middlewares/validate.middleware';
import { cacheRoute } from '../middlewares/cache.middleware';


// ══════════════════════════════════════════════════════════════
// DEPENDENCY INJECTION (manual, lightweight)
// ══════════════════════════════════════════════════════════════
const courseRepo = new CourseRepository();
const groupRepo = new GroupRepository();
const enrollRepo = new EnrollmentRepository();
const lessonRepo = new LessonRepository();
const paymentRepo = new PaymentRepository();   // ← Balans tekshiruvi uchun

const courseSvc = new CourseService(courseRepo);
const groupSvc = new GroupService(groupRepo);
// PaymentRepository 3-argument sifatida — skipBalanceCheck ўrniga haqiqiy balans sinxi
const enrollSvc = new EnrollmentService(enrollRepo, groupRepo, paymentRepo);
const lessonSvc = new LessonService(lessonRepo);

const courseCtrl = new CourseController(courseSvc);
const groupCtrl = new GroupController(groupSvc);
const enrollCtrl = new EnrollmentController(enrollSvc);
const lessonCtrl = new LessonController(lessonSvc);

const router = Router();

// ══════════════════════════════════════════════════════════════
// COURSES  →  /api/academic/courses
// ══════════════════════════════════════════════════════════════

/** GET  /api/academic/courses/subjects  — Fan ro'yxati (kurs yaratishda kerak) */
router.get(
    '/courses/subjects',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    cacheRoute('subjects', 600),
    courseCtrl.listSubjects
);

/** GET  /api/academic/courses?subjectId=&isActive=&level=&search=&page=&limit= */
router.get(
    '/courses',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    validate(paginationSchema, 'query'),
    cacheRoute('courses_list', 120),
    courseCtrl.list
);

/** GET  /api/academic/courses/:id */
router.get(
    '/courses/:id',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    courseCtrl.getOne
);

/** POST /api/academic/courses
 *  Body: { subjectId, name, description?, durationMonths?,
 *          lessonsPerWeek?, lessonDurationMin?, pricePerMonth, level? }
 */
router.post(
    '/courses',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),   // admin, manager
    validate(createCourseSchema, 'body'),
    courseCtrl.create
);

/** PATCH /api/academic/courses/:id  — qisman yangilash */
router.patch(
    '/courses/:id',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    validate(idParamSchema, 'params'),
    courseCtrl.update
);

/** PATCH /api/academic/courses/:id/toggle-active  — faollik holatini almashish */
router.patch(
    '/courses/:id/toggle-active',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    courseCtrl.toggleActive
);

/** DELETE /api/academic/courses/:id  — soft delete (faqat admin) */
router.delete(
    '/courses/:id',
    authenticate,
    authorize(...Roles.ADMIN_ONLY),
    courseCtrl.delete
);

// ══════════════════════════════════════════════════════════════
// GROUPS  →  /api/academic/groups
// Conflict Detection (o'qituvchi / xona band emas) avtomatik ishlaydi
// ══════════════════════════════════════════════════════════════

/** GET  /api/academic/groups?courseId=&teacherId=&status=&search=&page= */
router.get(
    '/groups',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    cacheRoute('groups_list', 60),
    groupCtrl.list
);

/** GET  /api/academic/groups/:id */
router.get(
    '/groups/:id',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    groupCtrl.getOne
);

/** POST /api/academic/groups
 *  Body: { courseId, teacherId, roomId?, dayComboId?,
 *          name, startTime, endTime, startDate, maxStudents? }
 *  ⚠️ O'qituvchi va xona conflict detection bajariladi
 */
router.post(
    '/groups',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    validate(createGroupSchema, 'body'),
    groupCtrl.create
);

/** PATCH /api/academic/groups/:id */
router.patch(
    '/groups/:id',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    groupCtrl.update
);

/** PATCH /api/academic/groups/:id/status
 *  Body: { status: 'recruiting'|'active'|'completed'|'cancelled' }
 */
router.patch(
    '/groups/:id/status',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    groupCtrl.changeStatus
);

/** DELETE /api/academic/groups/:id */
router.delete(
    '/groups/:id',
    authenticate,
    authorize(...Roles.ADMIN_ONLY),
    groupCtrl.delete
);

// ══════════════════════════════════════════════════════════════
// ENROLLMENTS  →  /api/academic/enrollments
// 3 qoida: capacity + duplicate + balance (ixtiyoriy)
// ══════════════════════════════════════════════════════════════

/** GET  /api/academic/groups/:groupId/enrollments — guruh talabalari */
router.get(
    '/groups/:groupId/enrollments',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    enrollCtrl.listByGroup
);

/** GET  /api/academic/enrollments/student/:studentId — talaba guruhlari tarixi */
router.get(
    '/enrollments/student/:studentId',
    authenticate,
    authorize(...Roles.ACADEMIC_ACCESS),
    enrollCtrl.listByStudent
);

/** POST /api/academic/enrollments
 *  Body: { groupId, studentId, discountPct?, notes?, skipBalanceCheck? }
 *  ⚠️ Capacity, duplicate va balance tekshiruvi bajariladi
 */
router.post(
    '/enrollments',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    validate(createEnrollmentSchema, 'body'),
    enrollCtrl.enroll
);

/** PATCH /api/academic/enrollments/:id/status
 *  Body: { status: 'active'|'frozen'|'left'|'graduated', leftAt? }
 */
router.patch(
    '/enrollments/:id/status',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    enrollCtrl.changeStatus
);

/** DELETE /api/academic/enrollments/:id — guruhdan chiqarish */
router.delete(
    '/enrollments/:id',
    authenticate,
    authorize(...Roles.FINANCE_ACCESS),
    enrollCtrl.remove
);

// ══════════════════════════════════════════════════════════════
// LESSONS  →  /api/academic/lessons
//  Dars jadvali + Room Conflict Detection
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/academic/lessons/room-check
 * ?roomId=&lessonDate=&startTime=&endTime=&excludeLessonId=
 *
 * Xona bandligi tekshiruvi (frontend real-time conflict preview)
 * ⚠️ Bu route /lessons/:id dan OLDIN bo'lishi kerak!
 */
router.get(
    '/lessons/room-check',
    authenticate, authorize(...Roles.ACADEMIC_ACCESS),
    lessonCtrl.checkRoom
);

/** GET /api/academic/lessons/today?teacherId= */
router.get(
    '/lessons/today',
    authenticate, authorize(...Roles.ACADEMIC_ACCESS),
    lessonCtrl.today
);

/** GET /api/academic/lessons?groupId=&roomId=&teacherId=&date=&fromDate=&toDate=&status=&page= */
router.get(
    '/lessons',
    authenticate, authorize(...Roles.ACADEMIC_ACCESS),
    lessonCtrl.list
);

/** GET /api/academic/lessons/:id */
router.get(
    '/lessons/:id',
    authenticate, authorize(...Roles.ACADEMIC_ACCESS),
    lessonCtrl.getOne
);

/**
 * POST /api/academic/lessons
 * Body: { groupId, teacherId, roomId?, lessonDate, startTime, endTime, topic?, homework? }
 *
 * 🚨 COLLISION DETECTION (2 qadam):
 *   1. roomId bilan boshqa guruh TIME overlap bor-yo'qligini tekshir
 *   2. teacherId bilan boshqa guruh TIME overlap bor-yo'qligini tekshir
 *   → Agar topilsa → 409 CONFLICT qaytariladi
 */
router.post(
    '/lessons',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    validate(createLessonSchema, 'body'),
    lessonCtrl.create
);

/** PATCH /api/academic/lessons/:id */
router.patch(
    '/lessons/:id',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    lessonCtrl.update
);

/**
 * PATCH /api/academic/lessons/:id/cancel
 * Body: { reason: string }
 */
router.patch(
    '/lessons/:id/cancel',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    lessonCtrl.cancel
);

/** DELETE /api/academic/lessons/:id */
router.delete(
    '/lessons/:id',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    lessonCtrl.delete
);

// ══════════════════════════════════════════════════════════════
// ROOMS  →  /api/academic/rooms (Lightweight inline logic)
// ══════════════════════════════════════════════════════════════

/** GET /api/academic/rooms */
router.get(
    '/rooms',
    authenticate,
    async (req, res) => {
        try {
            const { query } = await import('../config/database');
            const rows = await query('SELECT id, name, capacity FROM erp.rooms WHERE deleted_at IS NULL ORDER BY name');
            res.json({ success: true, data: rows });
        } catch (e) {
            res.status(500).json({ success: false, message: "Xona xatosi" });
        }
    }
);

/** POST /api/academic/rooms */
router.post(
    '/rooms',
    authenticate,
    authorize(...Roles.ADMIN_ONLY),
    async (req, res) => {
        try {
            const { name, capacity = 20 } = req.body;
            const { query } = await import('../config/database');
            const rows = await query('INSERT INTO erp.rooms (name, capacity) VALUES ($1, $2) RETURNING id, name, capacity', [name, capacity]);
            res.json({ success: true, data: rows[0] });
        } catch (e) {
            res.status(500).json({ success: false, message: "Xona yaratishda xato" });
        }
    }
);

export default router;
