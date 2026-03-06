import dotenv from 'dotenv';
dotenv.config();

// ============================================================
// Environment o'zgaruvchilarini tekshirish va eksport qilish
// ============================================================
function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`❌ Muhit o'zgaruvchisi topilmadi: ${key}`);
    }
    return value;
}

export const ENV = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),

    DB: {
        HOST: requireEnv('DB_HOST'),
        PORT: parseInt(process.env.DB_PORT || '5432', 10),
        NAME: requireEnv('DB_NAME'),
        USER: requireEnv('DB_USER'),
        PASSWORD: requireEnv('DB_PASSWORD'),
        POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10', 10),
        IDLE_MS: parseInt(process.env.DB_POOL_IDLE_MS || '10000', 10),
    },

    JWT: {
        ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
        ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
        REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),

    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;
