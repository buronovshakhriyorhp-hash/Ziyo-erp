import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/api-response.util';
import { logger } from '../utils/logger.util';

// ============================================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// express-async-errors bilan ishlaydi (try/catch kerak emas)
// ============================================================
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void {
    // Biznes xatolari (AppError)
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            error: {
                code: error.code,
                details: error.details,
            },
            meta: { timestamp: new Date().toISOString() },
        });
        return;
    }

    // PostgreSQL unikal kalit xatosi
    if ((error as NodeJS.ErrnoException).code === '23505') {
        res.status(409).json({
            success: false,
            message: 'Bu ma\'lumot allaqachon mavjud',
            error: { code: 'DUPLICATE_ENTRY' },
        });
        return;
    }

    // Kutilmagan xatolar — tafsilotlarni foydalanuvchiga ko'rsatmaymiz
    logger.error('Kutilmagan xato:', { message: error.message, stack: error.stack, path: req.path, method: req.method });

    res.status(500).json({
        success: false,
        message: 'Ichki server xatosi yuz berdi',
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            // DEV ONLY — ishlab chiqishda xatoni ko'rsatish
            detail: process.env.NODE_ENV !== 'production' ? error.message : undefined,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        },
        meta: { timestamp: new Date().toISOString() },
    });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        message: `'${req.method} ${req.path}' yo'li topilmadi`,
        error: { code: 'NOT_FOUND' },
    });
}
