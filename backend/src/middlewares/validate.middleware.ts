import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/api-response.util';

// ============================================================
// VALIDATE MIDDLEWARE
// "Hech qachon foydalanuvchi yuborgan ma'lumotga ishonma"
//   — Kiber-xavfsizlikning 1-qoidasi
//
// Zod ishlatishning afzalliklari:
//   ✅ Runtime tekshiruvi (TypeScript faqat compile-time)
//   ✅ Tozalash (strip unknown fields) — Mass Assignment hujumidan himoya
//   ✅ Transform (masalan: telefon raqamini standart formatga keltirish)
//   ✅ Aniq xato xabarlari
// ============================================================

// ──────────────────────────────────────────────────────────────
// QAYTA ISHLATILADIGAN ZOD TIPLASHTIRUVCHILAR (Reusable Validators)
// ──────────────────────────────────────────────────────────────

/**
 * O'zbekiston telefon raqami validatori.
 * Qabul qilinadigan formatlar:
 *   +998901234567
 *   998901234567
 *   0901234567
 *
 * Transform: oldingi bo'sh joylar tozalanadi
 */
const phoneValidator = z
    .string({ required_error: 'Telefon raqami talab qilinadi' })
    .trim()
    .min(9, 'Telefon raqami juda qisqa (min 9 ta raqam)')
    .max(15, 'Telefon raqami juda uzun (max 15 ta raqam)')
    .regex(
        /^\+?[0-9]{9,15}$/,
        'Telefon raqami faqat raqamlardan iborat bo\'lishi kerak. Misol: +998901234567'
    );

/**
 * Parol validatori (kuchli parol qoidalari).
 * Kamida:
 *   - 8 ta belgi
 *   - 1 ta katta harf (A-Z)
 *   - 1 ta kichik harf (a-z)
 *   - 1 ta raqam (0-9)
 *   - 1 ta maxsus belgi (!@#$%...)
 */
const strongPasswordValidator = z
    .string({ required_error: 'Parol talab qilinadi' })
    .min(8, 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak')
    .max(128, 'Parol 128 ta belgidan oshmasligi kerak')
    .regex(/[A-Z]/, 'Parol kamida 1 ta katta harf (A-Z) bo\'lishi kerak')
    .regex(/[a-z]/, 'Parol kamida 1 ta kichik harf (a-z) bo\'lishi kerak')
    .regex(/[0-9]/, 'Parol kamida 1 ta raqam (0-9) bo\'lishi kerak')
    .regex(/[^A-Za-z0-9]/, 'Parol kamida 1 ta maxsus belgi (!@#$%...) bo\'lishi kerak');

/**
 * Email validatori (ixtiyoriy maydon uchun)
 */
const emailValidator = z
    .string()
    .trim()
    .toLowerCase()
    .email('Email to\'g\'ri formatda bo\'lishi kerak (example@domain.com)')
    .max(255, 'Email 255 ta belgidan oshmasligi kerak');

/**
 * Ism/familiya validatori
 */
const nameValidator = (label: string) =>
    z
        .string({ required_error: `${label} talab qilinadi` })
        .trim()
        .min(2, `${label} kamida 2 ta harfdan iborat bo'lishi kerak`)
        .max(100, `${label} 100 ta belgidan oshmasligi kerak`)
        .regex(
            /^[a-zA-ZÀ-ÿА-Яа-яёЁ\s'-]+$/u,
            `${label} faqat harflar, bo'sh joy, apostrof yoki tire bo'lishi mumkin`
        );

// ──────────────────────────────────────────────────────────────
// ENDPOINT SCHEMALAR
// ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Yangi foydalanuvchi yaratish uchun (Admin/Manager tomonidan)
 */
export const registerSchema = z.object({
    roleId: z
        .number({ required_error: 'roleId talab qilinadi' })
        .int('roleId butun son bo\'lishi kerak')
        .min(1, 'roleId 1 dan katta bo\'lishi kerak'),

    firstName: nameValidator('Ism'),
    lastName: nameValidator('Familiya'),
    phone: phoneValidator,
    password: strongPasswordValidator,

    email: emailValidator
        .optional()
        .nullable(),

    avatarUrl: z
        .string()
        .url('Avatar URL to\'g\'ri URL manzil bo\'lishi kerak')
        .max(500, 'Avatar URL 500 belgidan oshmasligi kerak')
        .optional()
        .nullable(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

/**
 * POST /api/auth/login
 * Telefon + parol bilan kirish
 *
 * ⚠️ Login schema uchun parol kuchliligini tekshirmaymiz
 *    (Eski parollar bilan tizimga kirish imkoni qolishi uchun)
 */
export const loginSchema = z.object({
    phone: phoneValidator,
    password: z
        .string({ required_error: 'Parol talab qilinadi' })
        .min(1, 'Parol bo\'sh bo\'lmasligi kerak')
        .max(128, 'Parol 128 ta belgidan oshmasligi kerak'),
});

export type LoginDto = z.infer<typeof loginSchema>;

/**
 * POST /api/auth/refresh
 * Body orqali yuborilganda tekshiriladi (Cookie usuli tekshirilmaydi)
 */
export const refreshSchema = z.object({
    refreshToken: z
        .string({ required_error: 'refreshToken talab qilinadi' })
        .min(10, 'Yaroqsiz refresh token')
        .optional(),
}).optional();

/**
 * POST /api/auth/change-password
 * Joriy va yangi parolni tekshirish
 */
export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string({ required_error: 'Joriy parol talab qilinadi' })
            .min(1, 'Joriy parol bo\'sh bo\'lmasligi kerak')
            .max(128),

        newPassword: strongPasswordValidator,

        confirmPassword: z
            .string({ required_error: 'Parolni tasdiqlash talab qilinadi' })
            .min(1),
    })
    .refine(
        (data) => data.newPassword === data.confirmPassword,
        {
            message: 'Yangi parol va tasdiqlash paroli mos kelmayapti',
            path: ['confirmPassword'],
        }
    )
    .refine(
        (data) => data.currentPassword !== data.newPassword,
        {
            message: 'Yangi parol joriy parol bilan bir xil bo\'lmasligi kerak',
            path: ['newPassword'],
        }
    );

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

/**
 * Foydalanuvchi profilini yangilash uchun (PATCH /api/users/:id)
 */
export const updateProfileSchema = z.object({
    firstName: nameValidator('Ism').optional(),
    lastName: nameValidator('Familiya').optional(),
    phone: phoneValidator.optional(),
    email: emailValidator.optional().nullable(),
    avatarUrl: z.string().url().max(500).optional().nullable(),
    roleId: z.number().int().positive().optional(),
    password: strongPasswordValidator.optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// ──────────────────────────────────────────────────────────────
// VALIDATE MIDDLEWARE FACTORY
// ──────────────────────────────────────────────────────────────

/**
 * Zod schema bilan request.body ni tekshiruvchi middleware factory.
 *
 * 3 xil maqsad:
 *  1. TEKSHIRISH — majburiy maydonlar, formatlar, qoidalar
 *  2. TOZALASH   — noma'lum maydonlarni o'chirish (strip unknown)
 *                  → Mass Assignment hujumidan himoya
 *  3. TRANSFORM  — masalan email → kichik harflar, phone → trim
 *
 * @param schema    - Zod tekshiruv schemasi
 * @param source    - 'body' | 'params' | 'query' (standart: 'body')
 *
 * @example
 *   router.post('/login',  validate(loginSchema), ctrl.login)
 *   router.get('/users',   validate(filterSchema, 'query'), ctrl.list)
 *   router.get('/:id',     validate(idSchema, 'params'), ctrl.get)
 */
export function validate(
    schema: ZodSchema,
    source: 'body' | 'params' | 'query' = 'body'
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const data = req[source];

        const result = schema.safeParse(data);

        if (!result.success) {
            // Zod xatolarini tushunarli formatga o'tkazish
            const fieldErrors = result.error.flatten().fieldErrors;
            const formErrors = result.error.flatten().formErrors;

            // Birinchi xatoni log ga yozish (debug uchun)
            // logger.debug('Validation error:', { path: req.path, fieldErrors });

            sendError(
                res,
                'Kiritilgan ma\'lumotlar noto\'g\'ri',
                400,
                'VALIDATION_ERROR',
                {
                    fields: fieldErrors,           // Maydon-darajadagi xatolar
                    form: formErrors.length ? formErrors : undefined,   // Refine xatolari
                }
            );
            return;
        }

        // ✅ Muvaffaqiyatli: tozalangan va transform qilingan ma'lumot
        // Faqat schemada ko'rsatilgan maydonlar o'tadi (strip unknown)
        (req as unknown as Record<string, unknown>)[source] = result.data;
        next();
    };
}

// ──────────────────────────────────────────────────────────────
// PARAMS SCHEMALAR (URL parametrlari uchun)
// ──────────────────────────────────────────────────────────────

/**
 * :id parametri validatori — butun musbat son
 * @example router.get('/:id', validate(idParamSchema, 'params'), ctrl.get)
 */
export const idParamSchema = z.object({
    id: z.coerce
        .number({ invalid_type_error: 'ID raqam bo\'lishi kerak' })
        .int('ID butun son bo\'lishi kerak')
        .positive('ID musbat son bo\'lishi kerak'),
});

// ──────────────────────────────────────────────────────────────
// QUERY SCHEMALAR (Filterlash / Sahifalash)
// ──────────────────────────────────────────────────────────────

/**
 * Sahifalash va umumiy filterlash uchun query schema
 * @example router.get('/users', validate(paginationSchema, 'query'), ctrl.list)
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(['created_at', 'updated_at', 'first_name', 'last_name']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

// ──────────────────────────────────────────────────────────────
// FINANCE SCHEMALAR
// ──────────────────────────────────────────────────────────────

export const paymentSchema = z.object({
    enrollmentId: z.number().int().positive(),
    studentId: z.number().int().positive(),
    paymentMethodId: z.number().int().positive(),
    amount: z.number().positive(),
    paymentMonth: z.string().regex(/^\d{4}-\d{2}$/, "To'g'ri format emas (YYYY-MM)").optional(),
    note: z.string().max(255).optional()
});

export const expenseSchema = z.object({
    categoryId: z.number().int().positive(),
    amount: z.number().positive(),
    expenseDate: z.string().optional(),
    paymentMethodId: z.number().int().positive().optional(),
    description: z.string().max(500).optional(),
    receiptUrl: z.string().url().max(500).optional().nullable()
});

export const updateExpenseSchema = expenseSchema.partial();

export const calculateSalarySchema = z.object({
    teacherId: z.number().int().positive(),
    periodMonth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format'),
    deductions: z.number().min(0).optional(),
    notes: z.string().max(500).optional()
});

export const markSalaryPaidSchema = z.object({
    paymentMethodId: z.number().int().positive().optional()
});

// ──────────────────────────────────────────────────────────────
// ACADEMIC SCHEMALAR
// ──────────────────────────────────────────────────────────────

export const createCourseSchema = z.object({
    subjectId: z.number().int().positive(),
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    durationMonths: z.number().int().min(1).optional(),
    lessonsPerWeek: z.number().int().min(1).optional(),
    lessonDurationMin: z.number().int().min(30).optional(),
    pricePerMonth: z.number().min(0),
    level: z.string().max(50).optional()
});

export const createGroupSchema = z.object({
    courseId: z.number().int().positive(),
    teacherId: z.number().int().positive(),
    roomId: z.number().int().positive().optional().nullable(),
    dayComboId: z.number().int().positive().optional().nullable(),
    name: z.string().min(2).max(100),
    startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/),
    startDate: z.string(),
    maxStudents: z.number().int().min(1).optional()
});

export const createEnrollmentSchema = z.object({
    groupId: z.number().int().positive(),
    studentId: z.number().int().positive(),
    discountPct: z.number().min(0).max(100).optional(),
    notes: z.string().max(500).optional(),
    skipBalanceCheck: z.boolean().optional()
});

export const createLessonSchema = z.object({
    groupId: z.number().int().positive(),
    teacherId: z.number().int().positive(),
    roomId: z.number().int().positive().optional().nullable(),
    lessonDate: z.string(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/),
    topic: z.string().max(255).optional(),
    homework: z.string().max(500).optional()
});

// ──────────────────────────────────────────────────────────────
// CRM SCHEMALAR
// ──────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
    fullName: z.string().min(2).max(100),
    phone: phoneValidator,
    email: emailValidator.optional().nullable(),
    sourceId: z.number().int().positive().optional().nullable(),
    statusId: z.number().int().positive(),
    assignedTo: z.number().int().positive().optional().nullable(),
    courseInterest: z.string().max(100).optional(),
    notes: z.string().max(500).optional()
});

export const convertLeadSchema = z.object({
    birthDate: z.string().optional(),
    address: z.string().max(255).optional(),
    schoolName: z.string().max(100).optional(),
    grade: z.string().max(50).optional()
});

export const createCallSchema = z.object({
    durationSec: z.number().int().min(0).optional(),
    callType: z.enum(['outbound', 'inbound']).optional(),
    result: z.enum(['answered', 'no_answer', 'busy', 'wrong_number']).optional(),
    nextCallAt: z.string().optional().nullable(),
    notes: z.string().max(1000).optional()
});

export const createTaskSchema = z.object({
    leadId: z.number().int().positive().optional().nullable(),
    assignedTo: z.number().int().positive().optional().nullable(),
    title: z.string().min(3).max(255),
    description: z.string().max(1000).optional(),
    dueDate: z.string().optional()
});
