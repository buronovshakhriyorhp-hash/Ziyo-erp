import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';


/**
 * Express Middleware - GET Requestlarni Redis orqali keshlaydi.
 * 
 * @param keyPrefix Kesh uchun maxsus prefix (masalan: 'courses')
 * @param ttlSeconds Kesh qancha muddat saqlanishi (soniya, default: 300)
 */
export const cacheRoute = (keyPrefix: string, ttlSeconds: number = 300) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Faqat GET so'rovlari keshlanadi
        if (req.method !== 'GET') {
            return next();
        }

        // URL parametrlarini inobatga oladigan noyob kalit yasaladi
        const key = `${keyPrefix}:${req.originalUrl}`;

        try {
            const cachedData = await redisService.get<any>(key);

            if (cachedData) {
                // Agar data keshda bor bo'lsa darhol uzatamiz (X-Cache header bilan)
                res.setHeader('X-Cache', 'HIT');
                return res.json({ success: true, data: cachedData, message: 'Ma\'lumotlar keshdan olingan' });
            }

            // Keshda yo'q bo'lsa (MISS), response metodini o'zgartirib, javobni keshga saqlaymiz
            res.setHeader('X-Cache', 'MISS');

            // original sendSuccess ni ushlab olish qiyinroq, chunki Express da to'g'ridan to'g'ri send method override qilinadi
            const originalJson = res.json.bind(res);
            res.json = (body: any): Response => {
                // Faqatgina 200/success holatidagi 'data' qismini keshlaymiz
                if (body && body.success && body.data) {
                    redisService.set(key, body.data, ttlSeconds).catch(() => { });
                }
                return originalJson(body);
            };

            next();
        } catch (err) {
            // Redisda xatolik bo'lsa, tizim o'zgarishsiz ishlashda davom etaveradi
            next();
        }
    };
};
