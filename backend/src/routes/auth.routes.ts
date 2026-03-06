import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';
import {
    validate,
    registerSchema,
    loginSchema,
    changePasswordSchema,
} from '../middlewares/validate.middleware';

// ============================================================
// AUTH ROUTES
// Har bir endpoint uchun:
//   1. validate()     — kiruvchi ma'lumotlarni tekshirish (Zod)
//   2. authenticate() — JWT tokenni tekshirish
//   3. authorize()    — RBAC rol ruxsatini tekshirish
//   4. controller     — biznes mantig'i
// ============================================================

const router = Router();

// ── Dependency Injection (snizdan yuqoriga) ──────────────────
const userRepo = new UserRepository();
const sessionRepo = new SessionRepository();
const tokenSvc = new TokenService();
const authSvc = new AuthService(userRepo, sessionRepo, tokenSvc);
const authCtrl = new AuthController(authSvc);

// ============================================================
// OCHIQ ENDPOINTLAR (Token talab qilinmaydi)
// ============================================================

/**
 * POST /api/auth/register
 * Yangi foydalanuvchi yaratish
 *
 * 🔒 Faqat Admin va Manager
 * ✅ Validatsiya: registerSchema
 *    - roleId: musbat butun son
 *    - firstName / lastName: 2-100 harf
 *    - phone: +998XXXXXXXXX formati
 *    - password: kuchli parol (katta/kichik/raqam/maxsus)
 *    - email: to'g'ri format (ixtiyoriy)
 *    - avatarUrl: to'g'ri URL (ixtiyoriy)
 */
router.post(
    '/register',
    validate(registerSchema),              // 1. Ma'lumot tiplari tekshiruvi
    authenticate,                          // 2. JWT token tekshiruvi
    authorize(...Roles.FINANCE_ACCESS),    // 3. Faqat admin va manager
    authCtrl.register                      // 4. Controller
);

/**
 * POST /api/auth/login
 * Telefon + parol bilan kirish
 *
 * 🌐 Ochiq endpoint (hamma kira oladi)
 * ✅ Validatsiya: loginSchema
 *    - phone: O'zbek telefon formati
 *    - password: 1-128 belgi (login uchun kuchlilik talab qilinmaydi)
 *
 * ⚠️ Rate limit (app.ts): 10 ta urinish / 15 daqiqa
 */
router.post(
    '/login',
    validate(loginSchema),
    authCtrl.login
);

/**
 * POST /api/auth/refresh
 * Yangi access token olish (Refresh Token Rotation)
 *
 * 🌐 Ochiq endpoint — refresh token o'zi autentifikatsiya qiladi
 *    (Cookie yoki body.refreshToken)
 *
 * Validatsiya: Cookie'dan kelsa tekshirilmaydi,
 *              body'dan kelsa token mavjudligi tekshiriladi
 */
router.post(
    '/refresh',
    authCtrl.refresh
);

/**
 * POST /api/auth/logout
 * Joriy qurilmadan chiqish (refresh token o'chiriladi)
 *
 * 🌐 Ochiq endpoint — idempotent: token bo'lmasa ham 200 qaytaradi
 */
router.post(
    '/logout',
    authCtrl.logout
);

// ============================================================
// HIMOYALANGAN ENDPOINTLAR (JWT Token talab qilinadi)
// ============================================================

/**
 * GET /api/auth/me
 * Joriy autentifikatsiya qilingan foydalanuvchi ma'lumotlari
 *
 * 🔒 Barcha autentifikatsiya qilingan foydalanuvchilar
 */
router.get(
    '/me',
    authenticate,
    authCtrl.me
);

/**
 * POST /api/auth/logout-all
 * Barcha qurilmalardan chiqish (barcha sessiyalar o'chiriladi)
 *
 * 🔒 Barcha autentifikatsiya qilingan foydalanuvchilar
 */
router.post(
    '/logout-all',
    authenticate,
    authCtrl.logoutAll
);

/**
 * POST /api/auth/change-password
 * Parolni almashtirish
 *
 * 🔒 Barcha autentifikatsiya qilingan foydalanuvchilar
 * ✅ Validatsiya: changePasswordSchema
 *    - currentPassword: joriy parol (bo'sh bo'lmasligi kerak)
 *    - newPassword: kuchli yangi parol
 *    - confirmPassword: newPassword bilan mos kelishi kerak
 *    - Refine: newPassword !== currentPassword (bir xil bo'lmasligi)
 *
 * ⚠️ Muvaffaqiyatli bo'lganda barcha sessiyalar o'chiriladi!
 */
router.post(
    '/change-password',
    authenticate,
    validate(changePasswordSchema),
    authCtrl.changePassword
);

export default router;
