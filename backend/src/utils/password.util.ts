import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';

// ============================================================
// PASSWORD UTILITY — Bcrypt orqali xavfsiz parol boshqaruvi
// ============================================================

/**
 * Parolni hash qilish
 * saltRounds=12 — sekundiga bir necha hash (brute-force dan himoya)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, ENV.BCRYPT_SALT_ROUNDS);
}

/**
 * Parolni tekshirish (timing-safe taqqoslash)
 */
export async function verifyPassword(
    plainPassword: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
}

/**
 * Parol kuchliligi tekshiruvi
 * - Min 8 ta belgi
 * - Kamida 1 ta katta harf
 * - Kamida 1 ta kichik harf
 * - Kamida 1 ta raqam
 * - Kamida 1 ta maxsus belgi
 */
export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) errors.push('Kamida 8 ta belgi bo\'lishi kerak');
    if (!/[A-Z]/.test(password)) errors.push('Kamida 1 ta katta harf bo\'lishi kerak');
    if (!/[a-z]/.test(password)) errors.push('Kamida 1 ta kichik harf bo\'lishi kerak');
    if (!/[0-9]/.test(password)) errors.push('Kamida 1 ta raqam bo\'lishi kerak');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Kamida 1 ta maxsus belgi bo\'lishi kerak (!@#$...)');

    return { valid: errors.length === 0, errors };
}
