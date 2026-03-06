import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../domain/entities/user.entity';
import { sendError } from '../utils/api-response.util';

// ============================================================
// RBAC — Role-Based Access Control MIDDLEWARE
// Faqat authenticate() dan KEYIN ishlatiladi
// ============================================================

// ──────────────────────────────────────────────────────────────
// authorize() — Asosiy RBAC middleware
// ──────────────────────────────────────────────────────────────

/**
 * Belgilangan rollarga ega foydalanuvchilargagina ruxsat beradi.
 *
 * Ishlash tartibi:
 *  1. req.user mavjudligini tekshiradi (authenticate() o'tganmi?)
 *  2. Foydalanuvchi rolini allowedRoles ro'yxati bilan taqqoslaydi
 *  3. Rol mos kelmasa 403 Forbidden qaytaradi
 *
 * @param allowedRoles — Ruxsat etilgan rollar ro'yxati (vararg)
 *
 * @example
 *   // Faqat admin
 *   router.delete('/users/:id', authenticate, authorize('admin'), ctrl.delete)
 *
 *   // Admin va menejer
 *   router.get('/finance', authenticate, authorize('admin', 'manager'), ctrl.report)
 *
 *   // Barcha xodimlar (Roles konstantasidan)
 *   router.get('/attendance', authenticate, authorize(...Roles.ATTENDANCE_ACCESS), ctrl.list)
 */
export function authorize(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {

        // authenticate() ishlatilmaganligini tekshirish
        if (!req.user) {
            sendError(
                res,
                'Autentifikatsiya talab qilinadi. Avval authenticate() middleware qo\'llang.',
                401,
                'NOT_AUTHENTICATED'
            );
            return;
        }

        const userRole = req.user.role;

        // Ruxsat tekshiruvi
        if (!allowedRoles.includes(userRole)) {
            sendError(
                res,
                `Bu amalni bajarish uchun ruxsatingiz yo'q. ` +
                `Sizning rolingiz: '${userRole}'. ` +
                `Talab qilinadi: [${allowedRoles.join(', ')}]`,
                403,
                'INSUFFICIENT_PERMISSIONS'
            );
            return;
        }

        next();
    };
}

// ──────────────────────────────────────────────────────────────
// Roles — Markazlashtirilgan rol konstantalari
// ──────────────────────────────────────────────────────────────

/**
 * Har bir modul uchun standart ruxsat ro'yxatlari.
 *
 * Barcha rollash logikasi shu yerda — bitta joyni o'zgartirish kafi.
 *
 * @example
 *   authorize(...Roles.FINANCE_ACCESS)   // admin, manager
 *   authorize(...Roles.ACADEMIC_ACCESS)  // admin, manager, teacher
 */
export const Roles = {
    /** Tizimning to'liq boshqaruvchisi */
    ADMIN_ONLY: ['admin'] as UserRole[],

    /**
     * To'lov yozish — admin va menejer (kassir vazifasini bajaradi).
     * Agar kelajakda 'cashier' roli qo'shilsa, shu yerga qo'shing.
     */
    PAYMENT_WRITE: ['admin', 'manager'] as UserRole[],

    /** Moliya o'qish — admin va menejer */
    FINANCE_ACCESS: ['admin', 'manager'] as UserRole[],

    /** Qarzlarni boshqarish (overdue yangilash, bekor qilish) */
    DEBT_MANAGE: ['admin', 'manager'] as UserRole[],

    /** CRM (lidlar, qo'ng'iroqlar) — admin va menejer */
    CRM_ACCESS: ['admin', 'manager'] as UserRole[],

    /** Akademik modullar (kurs, guruh, dars) — admin, menejer, o'qituvchi */
    ACADEMIC_ACCESS: ['admin', 'manager', 'teacher'] as UserRole[],

    /** O'qituvchi profili va oyligi — admin, menejer, o'qituvchi */
    TEACHER_ACCESS: ['admin', 'manager', 'teacher'] as UserRole[],

    /** Davomat — admin, menejer, o'qituvchi */
    ATTENDANCE_ACCESS: ['admin', 'manager', 'teacher'] as UserRole[],

    /** Talabalar ma'lumotlari — barcha tizim foydalanuvchilari */
    STUDENT_VIEW: ['admin', 'manager', 'teacher', 'student', 'parent'] as UserRole[],

    /** Audit loglarni ko'rish — admin va menejer */
    AUDIT_ACCESS: ['admin', 'manager'] as UserRole[],
} as const;

// ──────────────────────────────────────────────────────────────
// authorizeOwnerOrAdmin() — Resurs egalik tekshiruvi
// ──────────────────────────────────────────────────────────────

/**
 * Foydalanuvchi faqat o'z resursiga kira olishi uchun middleware.
 * Admin va Manager istalgan resursga kira oladi.
 *
 * @param getUserIdFromRequest - So'rovdan maqsadli user ID ni ajratuvchi funksiya
 *
 * @example
 *   // GET /api/users/:userId/profile — o'zi yoki admin o'qiy oladi
 *   router.get(
 *     '/users/:userId/profile',
 *     authenticate,
 *     authorizeOwnerOrAdmin(req => parseInt(req.params.userId)),
 *     ctrl.getProfile
 *   )
 *
 * @example
 *   // Talaba faqat o'zining to'lovlarini ko'radi
 *   router.get(
 *     '/payments/my',
 *     authenticate,
 *     authorizeOwnerOrAdmin(req => req.user!.sub),
 *     paymentsController.myPayments
 *   )
 */
export function authorizeOwnerOrAdmin(
    getUserIdFromRequest: (req: Request) => number
) {
    return (req: Request, res: Response, next: NextFunction): void => {

        if (!req.user) {
            sendError(res, 'Autentifikatsiya talab qilinadi', 401, 'NOT_AUTHENTICATED');
            return;
        }

        const targetUserId = getUserIdFromRequest(req);
        const currentUserId = req.user.sub;
        const role = req.user.role;

        const isOwner = currentUserId === targetUserId;
        const isAdminOrManager = role === 'admin' || role === 'manager';

        if (!isOwner && !isAdminOrManager) {
            sendError(
                res,
                'Siz faqat o\'z ma\'lumotlaringizga kira olasiz.',
                403,
                'ACCESS_DENIED'
            );
            return;
        }

        next();
    };
}

// ──────────────────────────────────────────────────────────────
// authorizeRole() — Bitta rol uchun qisqartma (qulay shakl)
// ──────────────────────────────────────────────────────────────

/**
 * Faqat bitta rolni tekshirish uchun qisqartma helper.
 * authorize() bilan bir xil ishlaydi lekin bitta rol uchun yanada o'qimli.
 *
 * @example
 *   router.get('/admin/stats', authenticate, authorizeRole('admin'), ctrl.stats)
 */
export function authorizeRole(role: UserRole) {
    return authorize(role);
}
