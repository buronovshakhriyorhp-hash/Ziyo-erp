import { Response } from 'express';

// ============================================================
// API RESPONSE UTILITY — Standart javob formati
// ============================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}

/**
 * Muvaffaqiyatli javob
 */
export function sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Muvaffaqiyatli',
    statusCode = 200
): void {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
        meta: { timestamp: new Date().toISOString() },
    };
    res.status(statusCode).json(response);
}

/**
 * Xato javob
 */
export function sendError(
    res: Response,
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: unknown
): void {
    const response: ApiResponse = {
        success: false,
        message,
        error: { code, details },
        meta: { timestamp: new Date().toISOString() },
    };
    res.status(statusCode).json(response);
}

// ============================================================
// APP ERROR — Biznes xatolari uchun maxsus sinf
// ============================================================
export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 500,
        public readonly code: string = 'INTERNAL_ERROR',
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
        // Stack trace ni saqlab qolish
        Error.captureStackTrace(this, this.constructor);
    }
}
