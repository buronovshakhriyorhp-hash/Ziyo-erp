import { Router } from 'express';

// ── Controllers ───────────────────────────────────────────────
import { LeadController } from '../controllers/lead.controller';
import { TaskController } from '../controllers/task.controller';

// ── Services ─────────────────────────────────────────────────
import { LeadService } from '../services/lead.service';
import { TaskService } from '../services/task.service';

// ── Repositories ──────────────────────────────────────────────
import { LeadRepository } from '../repositories/lead.repository';
import { TaskRepository } from '../repositories/task.repository';

// ── Middlewares ───────────────────────────────────────────────
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';
import {
    validate,
    idParamSchema,
    paginationSchema,
    createLeadSchema,
    convertLeadSchema,
    createCallSchema,
    createTaskSchema
} from '../middlewares/validate.middleware';

// ══════════════════════════════════════════════════════════════
// DEPENDENCY INJECTION
// ══════════════════════════════════════════════════════════════
const leadRepo = new LeadRepository();
const taskRepo = new TaskRepository();

const leadSvc = new LeadService(leadRepo);
const taskSvc = new TaskService(taskRepo);

const leadCtrl = new LeadController(leadSvc);
const taskCtrl = new TaskController(taskSvc);

const router = Router();

// ══════════════════════════════════════════════════════════════
// LEADS  →  /api/crm/leads
//
// Lead Lifecycle: yangi → qo'ng'iroq qilindi → sinov darsiga keldi → talaba bo'ldi
// ══════════════════════════════════════════════════════════════

/** GET  /api/crm/leads?statusId=&assignedTo=&search=&page=&limit= */
router.get(
    '/leads',
    authenticate, authorize(...Roles.CRM_ACCESS), validate(paginationSchema, 'query'),
    leadCtrl.list
);

/** GET  /api/crm/leads/:id */
router.get(
    '/leads/:id',
    authenticate, authorize(...Roles.CRM_ACCESS),
    leadCtrl.getOne
);

/** POST /api/crm/leads
 *  Body: { fullName, phone, email?, sourceId?, statusId, assignedTo?, courseInterest?, notes? }
 */
router.post(
    '/leads',
    authenticate, authorize(...Roles.CRM_ACCESS), validate(createLeadSchema, 'body'),
    leadCtrl.create
);

/**
 * PATCH /api/crm/leads/:id
 *
 * ⚡ AVTO-KONVERSIYA:
 *   Agar statusId = 'Yozildi' statusiga mos kelsa va
 *   lid hali talabaga aylantirilmagan bo'lsa —
 *   avtomatik ravishda convertToStudent() tranzaksiyasi ishlaydi.
 *   Javobda: { userId, studentId, tempPassword, lead }
 */
router.patch(
    '/leads/:id',
    authenticate, authorize(...Roles.CRM_ACCESS),
    leadCtrl.update
);

/** DELETE /api/crm/leads/:id — Soft delete */
router.delete(
    '/leads/:id',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    leadCtrl.delete
);

// ──────────────────────────────────────────────────────────────
// LEAD CONVERSION  →  /api/crm/leads/:id/convert
//
// ⚡ ATOMIC TRANSACTION:
//   1. users jadvalida talaba yaratiladi (role = 'student')
//   2. student_profiles yaratiladi
//   3. leads.student_id va converted_at yangilanadi
//   4. call_log yoziladi (joriy menejer bilan)
// ──────────────────────────────────────────────────────────────

/** POST /api/crm/leads/:id/convert
 *  Body (ixtiyoriy): { birthDate?, address?, schoolName?, grade? }
 *  ⚠️ Javobda tempPassword — SMS/email orqali talabaga yuboring!
 */
router.post(
    '/leads/:id/convert',
    authenticate, authorize(...Roles.CRM_ACCESS), validate(idParamSchema, 'params'), validate(convertLeadSchema, 'body'),
    leadCtrl.convertToStudent
);

// ──────────────────────────────────────────────────────────────
// CALL LOGS — Lead bo'yicha  →  /api/crm/leads/:id/calls
// ──────────────────────────────────────────────────────────────

/** GET  /api/crm/leads/:id/calls — Qo'ng'iroqlar tarixi (bitta lid uchun) */
router.get(
    '/leads/:id/calls',
    authenticate, authorize(...Roles.CRM_ACCESS),
    leadCtrl.getCalls
);

/** POST /api/crm/leads/:id/calls
 *  Body: { durationSec?, callType?, result?, nextCallAt?, notes? }
 *  calledBy — JWT dan avtomatik olinadi
 */
router.post(
    '/leads/:id/calls',
    authenticate, authorize(...Roles.CRM_ACCESS), validate(idParamSchema, 'params'), validate(createCallSchema, 'body'),
    leadCtrl.addCall
);

// ══════════════════════════════════════════════════════════════
// CALL LOGS — Global  →  /api/crm/call-logs
//
// Menejer dashboardi uchun: barcha qo'ng'iroqlar, eslatmalar.
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/crm/call-logs/upcoming
 *
 * ⚡ Bu route /call-logs/:callId DAN OLDIN bo'lishi kerak!
 *
 * Kelajakdagi qo'ng'iroqlar eslatmasi (next_call_at bo'yicha o'sish).
 * Query: calledBy? (berilmasa — admin barcha eslatmalarni ko'radi)
 */
router.get(
    '/call-logs/upcoming',
    authenticate, authorize(...Roles.CRM_ACCESS),
    leadCtrl.upcomingCalls
);

/**
 * GET /api/crm/call-logs
 *
 * Barcha qo'ng'iroqlar ro'yxati (filter + pagination).
 * Query: calledBy?, leadId?, fromDate?, toDate?, page?, limit?
 */
router.get(
    '/call-logs',
    authenticate, authorize(...Roles.CRM_ACCESS),
    leadCtrl.listAllCalls
);

/**
 * DELETE /api/crm/call-logs/:callId — Soft delete
 * Faqat admin o'chira oladi.
 */
router.delete(
    '/call-logs/:callId',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    leadCtrl.deleteCall
);

// ══════════════════════════════════════════════════════════════
// TASKS  →  /api/crm/tasks
//
// Menejerlar uchun eslatma va vazifalar tizimi.
// Workflow: create → (work) → complete  |  reopen → (work) → complete
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/crm/tasks/overdue-summary
 *
 * Dashboard uchun: har bir menejer bo'yicha
 * overdueCount va dueTodayCount xulosasi.
 * ⚠️ Bu route /tasks/:id oldida bo'lishi kerak!
 */
router.get(
    '/tasks/overdue-summary',
    authenticate, authorize(...Roles.CRM_ACCESS),
    taskCtrl.overdueSum
);

/** GET /api/crm/tasks?assignedTo=&leadId=&isCompleted=&overdueOnly=&search=&page=&limit= */
router.get(
    '/tasks',
    authenticate, authorize(...Roles.CRM_ACCESS),
    taskCtrl.list
);

/** GET /api/crm/tasks/:id */
router.get(
    '/tasks/:id',
    authenticate, authorize(...Roles.CRM_ACCESS),
    taskCtrl.getOne
);

/** POST /api/crm/tasks
 *  Body: { leadId?, assignedTo?, title, description?, dueDate? }
 *  assignedTo yo'q bo'lsa — JWT dan olinadi (joriy foydalanuvchi)
 */
router.post(
    '/tasks',
    authenticate, authorize(...Roles.CRM_ACCESS), validate(createTaskSchema, 'body'),
    taskCtrl.create
);

/** PATCH /api/crm/tasks/:id */
router.patch(
    '/tasks/:id',
    authenticate, authorize(...Roles.CRM_ACCESS),
    taskCtrl.update
);

/** PATCH /api/crm/tasks/:id/complete — ✅ Bajarildi */
router.patch(
    '/tasks/:id/complete',
    authenticate, authorize(...Roles.CRM_ACCESS),
    taskCtrl.complete
);

/** PATCH /api/crm/tasks/:id/reopen — 🔄 Qayta ochish */
router.patch(
    '/tasks/:id/reopen',
    authenticate, authorize(...Roles.CRM_ACCESS),
    taskCtrl.reopen
);

/** DELETE /api/crm/tasks/:id */
router.delete(
    '/tasks/:id',
    authenticate, authorize(...Roles.FINANCE_ACCESS),   // admin yoki manager
    taskCtrl.delete
);

// ──────────────────────────────────────────────────────────────
// LOOKUP ENDPOINTS
// ──────────────────────────────────────────────────────────────

/** GET /api/crm/statuses — Lid statuslari (kanban/filter uchun) */
router.get(
    '/statuses',
    authenticate, authorize(...Roles.CRM_ACCESS),
    async (_req, res) => {
        const { query } = await import('../config/database');
        const statuses = await query(
            `SELECT id, name, color, sort_order
             FROM lead_statuses
             WHERE deleted_at IS NULL
             ORDER BY sort_order`
        );
        res.json({ success: true, data: statuses });
    }
);

/** GET /api/crm/sources — Lid manbalari */
router.get(
    '/sources',
    authenticate, authorize(...Roles.CRM_ACCESS),
    async (_req, res) => {
        const { query } = await import('../config/database');
        const sources = await query(
            `SELECT id, name FROM lead_sources
             WHERE deleted_at IS NULL ORDER BY name`
        );
        res.json({ success: true, data: sources });
    }
);

export default router;
