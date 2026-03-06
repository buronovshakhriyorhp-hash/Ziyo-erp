import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { AccessTokenPayload } from '../domain/entities/user.entity';
import { sendError } from '../utils/api-response.util';

// ============================================================
// req.user TIPI KENGAYTMASI (TypeScript global)
// ============================================================
declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenPayload;  // authenticate() dan keyin to'ldiriladi
        }
    }
}

// TokenService — singleton sifatida (har so'rovda yangi yaratilmaydi)
const tokenService = new TokenService();

// ============================================================
// AUTHENTICATE MIDDLEWARE
// ============================================================

/**
 * Himoyalangan endpointlar uchun majburiy JWT tekshiruvi.
 *
 * Kutilgan header formati:
 *   Authorization: Bearer <access_token>
 *
 * Muvaffaqiyatli bo'lsa:
 *   → req.user = { sub, role, roleId, iat, exp }
 *   → next() chaqiriladi
 *
 * Muvaffaqiyatsiz bo'lsa (3 xil holat):
 *   401 MISSING_TOKEN      — Header umuman yo'q yoki 'Bearer ' bilan boshlanmagan
 *   401 TOKEN_EXPIRED      — Token imzosi to'g'ri lekin muddati o'tgan
 *   401 INVALID_TOKEN      — Token imzosi noto'g'ri yoki buzilgan
 *
 * Foydalanish:
 *   router.get('/profile', authenticate, profileController.get)
 */
export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    // 1. Header tekshiruvi
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(
            res,
            'Autentifikatsiya talab qilinadi. Authorization: Bearer <token>',
            401,
            'MISSING_TOKEN'
        );
        return;
    }

    // 2. Token qismini ajratish
    const token = authHeader.split(' ')[1];

    // 3. Token bo'sh bo'lsa
    if (!token || token.trim() === '') {
        sendError(res, 'Token bo\'sh', 401, 'MISSING_TOKEN');
        return;
    }

    // 4. JWT tekshirish
    try {
        const payload = tokenService.verifyAccessToken(token);
        req.user = payload;    // keyingi middleware/controller uchun saqlaymiz
        next();
    } catch (error) {
        const errorCode = error instanceof Error ? error.message : 'INVALID_TOKEN';

        if (errorCode === 'ACCESS_TOKEN_EXPIRED') {
            sendError(
                res,
                'Token muddati tugagan. /api/auth/refresh dan yangi token oling.',
                401,
                'TOKEN_EXPIRED'
            );
        } else {
            sendError(
                res,
                'Token yaroqsiz yoki buzilgan.',
                401,
                'INVALID_TOKEN'
            );
        }
    }
}

// ============================================================
// OPTIONAL AUTHENTICATE MIDDLEWARE
// ============================================================

/**
 * Ixtiyoriy autentifikatsiya — token bor bo'lsa yukla, bo'lmasa o'tkaztir.
 *
 * Ommaviy endpointlarda ham foydalanuvchi-spesifik javob berish uchun.
 *
 * @example
 *   // Kurs ro'yxati: hamma ko'radi, autentifikatsiya bo'lsa enrollment holati ham ko'rsatiladi
 *   router.get('/courses', optionalAuthenticate, courseController.list)
 */
export function optionalAuthenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                req.user = tokenService.verifyAccessToken(token);
            } catch {
                // Token noto'g'ri — e'tiborsiz qoldiramiz, xato bermaymiz
                // req.user = undefined bo'lib qoladi
            }
        }
    }
    next();
}
