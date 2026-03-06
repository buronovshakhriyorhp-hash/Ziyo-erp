import Redis from 'ioredis';
// Imports removed, using console for logging

class RedisService {
    private client: Redis | null = null;
    private isConnected: boolean = false;

    constructor() {
        // Faqatgina Redis URI yoki config mavjudligini tekshiramiz
        // Hozircha lokal testlar uchun standart portga ulab ko'ramiz
        this.client = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('🟢 Redis kesh serveriga muvaffaqiyatli ulandi');
        });

        this.client.on('error', (err) => {
            if (this.isConnected) {
                console.error('🔴 Redis ulanishida xatolik:', err);
                this.isConnected = false;
            }
        });
    }

    /**
     * Keshga ma'lumot saqlash
     * @param key Kesh kaliti
     * @param data Saqlanuvchi ma'lumot
     * @param ttlSeconds Necha soniya saqlanishi (default 5 min = 300s)
     */
    async set(key: string, data: any, ttlSeconds: number = 300): Promise<boolean> {
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.setex(key, ttlSeconds, JSON.stringify(data));
            return true;
        } catch (err) {
            console.warn(`Redis set xatosi: ${key}`, err);
            return false;
        }
    }

    /**
     * Keshdan ma'lumotni o'qish
     * @param key Kesh kaliti
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) return null;
        try {
            const data = await this.client.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (err) {
            console.warn(`Redis get xatosi: ${key}`, err);
            return null;
        }
    }

    /**
     * Kalit yoki kalitlar ro'yxatini keshdan o'chirish (Invalidaytsiya)
     * Prefix bilan o'chirish uchun masalan `delByPattern` ishlatiladi
     * @param key Kalit nomi
     */
    async del(key: string): Promise<boolean> {
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (err) {
            console.warn(`Redis del xatosi: ${key}`, err);
            return false;
        }
    }

    /**
     * Prefix orqali barcha bog'liq keshni tozalash (masalan: barcha courses keshini tozalash)
     * @param pattern Prefix (masalan 'courses:*')
     */
    async delByPattern(pattern: string): Promise<boolean> {
        if (!this.isConnected || !this.client) return false;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
            return true;
        } catch (err) {
            console.warn(`Redis delByPattern xatosi: ${pattern}`, err);
            return false;
        }
    }

    /**
     * Redis ulanishini yopish (Graceful shutdown)
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
        }
    }
}

export const redisService = new RedisService();
