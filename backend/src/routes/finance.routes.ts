import { Router, Request, Response, NextFunction } from 'express';

// ── Controllers ───────────────────────────────────────────────
import { PaymentController } from '../controllers/payment.controller';
import { ExpenseController } from '../controllers/expense.controller';
import { SalaryController } from '../controllers/salary.controller';

// ── Services ─────────────────────────────────────────────────
import { PaymentService } from '../services/payment.service';
import { ExpenseService } from '../services/expense.service';
import { SalaryService } from '../services/salary.service';

// ── Repositories ──────────────────────────────────────────────
import { PaymentRepository } from '../repositories/payment.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { SalaryRepository } from '../repositories/salary.repository';

// ── Middlewares ───────────────────────────────────────────────
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';

// ══════════════════════════════════════════════════════════════
// DEPENDENCY INJECTION
// ══════════════════════════════════════════════════════════════
const paymentRepo = new PaymentRepository();
const expenseRepo = new ExpenseRepository();
const salaryRepo = new SalaryRepository();

const paymentSvc = new PaymentService(paymentRepo);
const expenseSvc = new ExpenseService(expenseRepo);
const salarySvc = new SalaryService(salaryRepo);

const paymentCtrl = new PaymentController(paymentSvc);
const expenseCtrl = new ExpenseController(expenseSvc);
const salaryCtrl = new SalaryController(salarySvc);

const router = Router();

// ══════════════════════════════════════════════════════════════
// PAYMENTS  →  /api/finance/payments
//
// To'lov qabul qilish + qarzni avtomatik yangilash (TRANSACTION)
// Xavfsizlik: GET — FINANCE_ACCESS, POST — PAYMENT_WRITE, DELETE — ADMIN_ONLY
// ══════════════════════════════════════════════════════════════

/** GET /api/finance/payments?studentId=&groupId=&fromDate=&toDate=&page=&limit= */
router.get(
    '/payments',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    paymentCtrl.list
);

/** GET /api/finance/payments/:id */
router.get(
    '/payments/:id',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    paymentCtrl.getOne
);

/**
 * POST /api/finance/payments
 * Body: { enrollmentId, studentId, paymentMethodId, amount, paymentMonth, ... }
 *
 * ⚠️ TRANZAKSIYA: payments INSERT + payment_debts UPDATE atomik
 * 🔒 Faqat PAYMENT_WRITE rollarga ruxsat (admin, manager / kassir)
 *    → Balans (balanceAfter) response-da qaytariladi
 */
router.post(
    '/payments',
    authenticate, authorize(...Roles.PAYMENT_WRITE),
    paymentCtrl.makePayment
);

/**
 * DELETE /api/finance/payments/:id
 * Faqat bugungi to'lovni bekor qilish mumkin.
 * payment_debts.amount_paid orqaga qaytariladi (ATOMIC).
 * 🔒 Faqat ADMIN_ONLY
 */
router.delete(
    '/payments/:id',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    paymentCtrl.cancel
);

// ── Talaba balansi ────────────────────────────────────────────

/** GET /api/finance/students/:studentId/balance */
router.get(
    '/students/:studentId/balance',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    paymentCtrl.getBalance
);

/** GET /api/finance/debts?studentId=&status=&overdueOnly=&page=&limit= */
router.get(
    '/debts',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    paymentCtrl.listDebts
);

/**
 * POST /api/finance/debts/mark-overdue
 * Muddati o'tgan (due_date < today) qarzlarni 'overdue' ga o'tkazadi.
 * Cron yoki admin tomonidan qo'lda ishga tushiriladi.
 * 🔒 Faqat ADMIN_ONLY
 */
router.post(
    '/debts/mark-overdue',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    paymentCtrl.markOverdue
);

// ══════════════════════════════════════════════════════════════
// EXPENSES  →  /api/finance/expenses
// ══════════════════════════════════════════════════════════════

/** GET /api/finance/expenses/categories */
router.get(
    '/expenses/categories',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    expenseCtrl.listCategories
);

/**
 * GET /api/finance/expenses/summary?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 * Kategoriya bo'yicha xarajatlar xulosasi
 */
router.get(
    '/expenses/summary',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    expenseCtrl.getSummary
);

/** GET /api/finance/expenses?categoryId=&fromDate=&toDate=&page=&limit= */
router.get(
    '/expenses',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    expenseCtrl.list
);

/** GET /api/finance/expenses/:id */
router.get(
    '/expenses/:id',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    expenseCtrl.getOne
);

/** POST /api/finance/expenses
 *  Body: { categoryId, amount, expenseDate?, paymentMethodId?, description?, receiptUrl? }
 */
router.post(
    '/expenses',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    expenseCtrl.create
);

/** PATCH /api/finance/expenses/:id */
router.patch(
    '/expenses/:id',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    expenseCtrl.update
);

/** DELETE /api/finance/expenses/:id */
router.delete(
    '/expenses/:id',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    expenseCtrl.delete
);

// ══════════════════════════════════════════════════════════════
// SALARIES  →  /api/finance/salaries
//
// Workflow: calculate → approve → mark-paid
// ══════════════════════════════════════════════════════════════

/** GET /api/finance/salaries?teacherId=&status=&year=&month=&page=&limit= */
router.get(
    '/salaries',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    salaryCtrl.list
);

/** GET /api/finance/salaries/settings/:teacherId */
router.get(
    '/salaries/settings/:teacherId',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    salaryCtrl.getSettings
);

/** POST /api/finance/salaries/settings */
router.post(
    '/salaries/settings',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    salaryCtrl.updateSettings
);

/** GET /api/finance/salaries/:id */
router.get(
    '/salaries/:id',
    authenticate, authorize(...Roles.FINANCE_ACCESS),
    salaryCtrl.getOne
);

/**
 * POST /api/finance/salaries/calculate
 * Body: { teacherId, periodMonth (YYYY-MM-01), deductions?, notes? }
 *
 * ⚠️ TRANZAKSIYA:
 *   1. Darslar hisob (lessons jadval)
 *   2. Davomat % (student_attendance)
 *   3. KPI bonus = base * rate% * attendance%
 *   4. teacher_salary_periods ga UPSERT
 */
router.post(
    '/salaries/calculate',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    salaryCtrl.calculate
);

/**
 * PATCH /api/finance/salaries/:id/approve
 * Status: calculated → approved
 */
router.patch(
    '/salaries/:id/approve',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    salaryCtrl.approve
);

/**
 * PATCH /api/finance/salaries/:id/mark-paid
 * Body: { paymentMethodId? }
 * Status: approved → paid
 */
router.patch(
    '/salaries/:id/mark-paid',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    salaryCtrl.markPaid
);

/** DELETE /api/finance/salaries/:id  — faqat 'calculated' holatida */
router.delete(
    '/salaries/:id',
    authenticate, authorize(...Roles.ADMIN_ONLY),
    salaryCtrl.delete
);

/**
 * O'qituvchi shaxsiy kabineti uchun
 * Teacher o'zining oyliklarini ko'radi
 */
router.get(
    '/my-salaries',
    authenticate, authorize('teacher'),
    (req: Request, _res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !user.sub) {
            // Agar user yoki sub bo'lmasa, bu holat normal emas — guard
            // Global error handler AppError ni ushlab oladi
            const { AppError } = require('../utils/api-response.util') as typeof import('../utils/api-response.util');
            throw new AppError('Teacher profili topilmadi', 400, 'TEACHER_PROFILE_NOT_FOUND');
        }

        // TeacherId ni req.user.sub dan olamiz (agar u teacher bo'lsa)
        // Bizda list metodida teacherId bor, shuni query ga inject qilamiz
        req.query.teacherId = user.sub.toString();
        next();
    },
    salaryCtrl.list
);

export default router;
