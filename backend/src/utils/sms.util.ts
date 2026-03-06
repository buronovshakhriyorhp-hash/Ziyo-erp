import { logger } from './logger.util';

/**
 * Mock SMS Gateway
 * Real loyihada bu yerda Eskiz.uz, Playmobile yoki boshqa provayder API si chaqiriladi
 */
export const sendMockSMS = async (phone: string, text: string): Promise<boolean> => {
    try {
        logger.info('📱 [SMS GATEWAY MOCK] SMS Yuborish jarayoni boshlandi...');
        logger.info(`📱 Qabul qiluvchi: ${phone}`);
        logger.info(`📱 Xabar matni: "${text}"`);

        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        logger.info('✅ [SMS GATEWAY MOCK] SMS muvaffaqiyatli yetkazildi!');
        return true;
    } catch (error) {
        logger.error('❌ [SMS GATEWAY MOCK] SMS yuborishda xatolik yuz berdi:', error);
        return false;
    }
};
