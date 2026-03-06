import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import 'express-async-errors'; // async xatolarini route handlerdan global handlergа uzatish

import { ENV } from './config/env';
import authRoutes from './routes/auth.routes';
import academicRoutes from './routes/academic.routes';
import crmRoutes from './routes/crm.routes';
import financeRoutes from './routes/finance.routes';
import attendanceRoutes from './routes/attendance.routes';
import analyticsRoutes from './routes/analytics.routes';
import userRoutes from './routes/user.routes';
import auditRoutes from './routes/audit.routes';
import systemSettingsRoutes from './routes/system-settings.routes';
import documentRoutes from './routes/document.routes';
import searchRoutes from './routes/search.routes';
import paymentGatewayRoutes from './routes/payment-gateway.routes';
import aiRoutes from './routes/ai.routes';
import botRoutes from './routes/bot.routes';
import lmsRoutes from './routes/lms.routes';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.middleware';
import { logger } from './utils/logger.util';

// ============================================================
// EXPRESS APPLICATION FACTORY
// ============================================================

export function createApp(): Application {
    const app = express();

    // ---- 1. XAVFSIZLIK HEADERLARI (Helmet) ----
    app.use(helmet({
        contentSecurityPolicy: ENV.IS_PRODUCTION,
        crossOriginEmbedderPolicy: ENV.IS_PRODUCTION,
    }));

    // ---- 2. CORS ----
    app.use(cors({
        origin: (origin, callback) => {
            // Developmentda hamma narsaga ruxsat
            if (!ENV.IS_PRODUCTION) {
                return callback(null, true);
            }
            // Productionda faqat ruxsat etilgan originlar
            if (!origin || ENV.ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }
            // Vercel preview va branch URL'lar uchun qo'shimcha tekshiruv (ixtiyoriy)
            if (origin.endsWith('.vercel.app') || origin.includes('ziyochashmasi.uz')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,    // Cookie'larni yuborish uchun zarur
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // ---- 3. RATE LIMITING (Login uchun qattiqroq cheklov) ----
    const globalLimiter = rateLimit({
        windowMs: ENV.RATE_LIMIT.WINDOW_MS,
        max: ENV.RATE_LIMIT.MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Juda ko\'p so\'rov. Biroz kuting.',
            error: { code: 'RATE_LIMITED' },
        },
    });

    // Login uchun juda qattiq cheklov (brute-force himoyasi)
    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,  // 15 daqiqa
        max: 10,               // 15 daqiqada 10 ta urinish
        skipSuccessfulRequests: true,
        message: {
            success: false,
            message: 'Juda ko\'p kirish urinishlari. 15 daqiqadan so\'ng qayta urining.',
            error: { code: 'LOGIN_RATE_LIMITED' },
        },
    });

    app.use(globalLimiter);

    // ---- 4. BODY PARSERS ----
    app.use(express.json({ limit: '10kb' }));      // Katta JSON'lar o'chiriladi
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // ---- 5. SO'ROV LOGLASH ----
    app.use((req, _res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
    });

    // ---- 6. SOG'LIQ TEKSHIRISH (Health Checks) ----
    const healthCheck = (_req: any, res: any) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: ENV.NODE_ENV,
            version: '1.1.0'
        });
    };

    app.get('/health', healthCheck);
    app.get('/api/health', healthCheck); // Proxy orqali kelganda fallback

    // ---- 7. MARSHRUTLAR (Routes) ----
    app.use('/api/auth', loginLimiter, authRoutes);
    app.use('/api/academic', academicRoutes);    // Kurslar, Guruhlar, Talabalar, Darslar
    app.use('/api/crm', crmRoutes);         // Lidlar, Vazifalar, Konversiya
    app.use('/api/finance', financeRoutes);     // To'lovlar, Maoshlar, Xarajatlar
    app.use('/api/attendance', attendanceRoutes);  // Davomat + Billing
    app.use('/api/analytics', analyticsRoutes);  // Tahlil, Hisobot, Export
    app.use('/api/users', userRoutes);            // Xodimlarni boshqarish
    app.use('/api/audit', auditRoutes);           // Audit Logging (ADMIN/MANAGER)
    app.use('/api/settings', systemSettingsRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/search', searchRoutes);         // Global Qidiruv
    app.use('/api/payments', paymentGatewayRoutes); // Payme + Click webhooks
    app.use('/api/ai', aiRoutes);                   // AI: Churn Detection, Forecasting
    app.use('/api/bot', botRoutes);                 // Telegram Bot Admin API
    app.use('/api/lms', lmsRoutes);                 // Student LMS Gamification API

    // ---- 8. XATO HANDLERLARI ----
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
