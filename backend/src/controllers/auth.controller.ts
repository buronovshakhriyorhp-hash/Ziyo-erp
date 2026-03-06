import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError, AppError } from '../utils/api-response.util';

// ============================================================
// AUTH CONTROLLER
// Mas'uliyat: HTTP so'rov/javob boshqaruvi FAQAT.
//   Biznes mantiqi bu yerda bo'lmasligi kerak —
//   faqat AuthService ga yo'naltirish va javob yuborish.
// ============================================================

// Cookie konfiguratsiyasi — bitta joyda (DRY)
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,                                        // XSS dan himoya: JS o'qiy olmaydi
    secure: process.env.NODE_ENV === 'production',       // HTTPS majburiy (production)
    sameSite: 'strict' as const,                           // CSRF dan himoya
    maxAge: 7 * 24 * 60 * 60 * 1000,                    // 7 kun (millisekund)
    path: '/api/auth',                                 // Faqat /api/auth yo'lida yuboriladi
};

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // ══════════════════════════════════════════════════════════
    // POST /api/auth/register
    // ══════════════════════════════════════════════════════════

    /**
     * Yangi foydalanuvchi yaratish.
     *
     * @body { roleId, firstName, lastName, phone, password, email?, avatarUrl? }
     * @access Admin, Manager
     *
     * @returns { accessToken, user }
     */
    register = async (req: Request, res: Response): Promise<void> => {
        const { roleId, firstName, lastName, phone, password, email, avatarUrl } = req.body;

        const result = await this.authService.register(
            { roleId, firstName, lastName, phone, password, email, avatarUrl },
            {
                ipAddress: req.ip ?? null,
                userAgent: req.headers['user-agent'] ?? null,
            }
        );

        // Refresh token → HttpOnly Cookie
        res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

        sendSuccess(
            res,
            { accessToken: result.accessToken, user: result.user },
            'Foydalanuvchi muvaffaqiyatli yaratildi',
            201                                              // 201 Created
        );
    };

    // ══════════════════════════════════════════════════════════
    // POST /api/auth/login
    // ══════════════════════════════════════════════════════════

    /**
     * Tizimga kirish — telefon + parol.
     *
     * @body { phone, password }
     * @access Ochiq endpoint
     *
     * @returns { accessToken, user }
     *
     * Xavfsizlik:
     *  - Refresh token → HttpOnly Cookie (JavaScript o'qiy olmaydi)
     *  - Access token  → JSON body (xotiraga saqlanadi, LOCAL storage EMAS)
     *  - Rate limit    → app.ts da /api/auth uchun 10 req/15min
     */
    login = async (req: Request, res: Response): Promise<void> => {
        const { phone, password } = req.body;

        const result = await this.authService.login(
            { phone, password },
            {
                ipAddress: req.ip ?? null,
                userAgent: req.headers['user-agent'] ?? null,
            }
        );

        res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

        sendSuccess(
            res,
            { accessToken: result.accessToken, user: result.user },
            'Tizimga muvaffaqiyatli kirdingiz'
        );
    };

    // ══════════════════════════════════════════════════════════
    // POST /api/auth/refresh
    // ══════════════════════════════════════════════════════════

    /**
     * Yangi access token olish (Refresh Token Rotation).
     *
     * Refresh token manbalari (ustuvorlik tartibi):
     *  1. Cookie (xavfsizroq — HttpOnly)
     *  2. Request body (Cookie ishlamasa — mobil ilovalar uchun)
     *
     * @access Ochiq endpoint (refresh token o'zi autentifikatsiya vazifasini bajaradi)
     */
    refresh = async (req: Request, res: Response): Promise<void> => {
        const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;

        if (!refreshToken) {
            throw new AppError('Refresh token topilmadi', 401, 'MISSING_REFRESH_TOKEN');
        }

        const result = await this.authService.refresh(refreshToken, {
            ipAddress: req.ip ?? null,
            userAgent: req.headers['user-agent'] ?? null,
        });

        // Yangi refresh token → Cookie ni yangilash
        res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

        sendSuccess(
            res,
            { accessToken: result.accessToken, user: result.user },
            'Token muvaffaqiyatli yangilandi'
        );
    };

    // ══════════════════════════════════════════════════════════
    // POST /api/auth/logout
    // ══════════════════════════════════════════════════════════

    /**
     * Joriy qurilmadan chiqish.
     * Refresh token o'chiriladi, cookie tozalanadi.
     *
     * @access Ochiq endpoint (refresh token o'zi identifikatsiya qiladi)
     */
    logout = async (req: Request, res: Response): Promise<void> => {
        const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;

        // Token bor bo'lsa o'chiramiz, yo'q bo'lsa ham 200 qaytaramiz
        // (idempotent: bir necha marta chaqirsa ham xato bermaydi)
        if (refreshToken) {
            await this.authService.logout(refreshToken);
        }

        res.clearCookie('refreshToken', { path: '/api/auth' });
        sendSuccess(res, null, 'Tizimdan muvaffaqiyatli chiqdingiz');
    };

    // ══════════════════════════════════════════════════════════
    // POST /api/auth/logout-all
    // ══════════════════════════════════════════════════════════

    /**
     * Barcha qurilmalardan chiqish.
     * (Masalan: parol o'g'irlangan bo'lsa barcha sessiyalarni bekor qilish)
     *
     * @access JWT autentifikatsiya talab qiladi
     */
    logoutAll = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.sub;         // authenticate middleware yuklagan
        await this.authService.logoutAll(userId);
        res.clearCookie('refreshToken', { path: '/api/auth' });
        sendSuccess(res, null, 'Barcha qurilmalardan chiqdingiz');
    };

    // ══════════════════════════════════════════════════════════
    // GET /api/auth/me
    // ══════════════════════════════════════════════════════════

    /**
     * Joriy foydalanuvchi ma'lumotlari.
     * Token ichidagi payload qaytariladi (DB ga murojaat qilinmaydi — tezroq).
     *
     * @access JWT autentifikatsiya talab qiladi
     */
    me = async (req: Request, res: Response): Promise<void> => {
        sendSuccess(res, req.user, 'Joriy foydalanuvchi');
    };

    // ══════════════════════════════════════════════════════════
    // POST /api/auth/change-password
    // ══════════════════════════════════════════════════════════

    /**
     * Parolni almashtirish.
     * Joriy paroli to'g'ri bo'lsa, yangi parol o'rnatiladi.
     * Barcha sessiyalar o'chiriladi (boshqa qurilmalardan chiqaradi).
     *
     * @body { currentPassword, newPassword }
     * @access JWT autentifikatsiya talab qiladi
     */
    changePassword = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.sub;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new AppError(
                'currentPassword va newPassword talab qilinadi',
                400,
                'MISSING_FIELDS'
            );
        }

        await this.authService.changePassword(userId, { currentPassword, newPassword });

        res.clearCookie('refreshToken', { path: '/api/auth' });
        sendSuccess(
            res,
            null,
            'Parol muvaffaqiyatli o\'zgartirildi. Qaytadan kiring.'
        );
    };
}
