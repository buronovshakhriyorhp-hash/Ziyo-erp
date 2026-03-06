import { query } from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * 1-sana Debt Cron Job
 * Har 1 soatda ishga tushib, agar bugun oyning 1-sanasi bo'lsa va erta tong bo'lsa
 * o'quvchilar uchun shu oy uchun qarzdorlikni (payment_debts) avtomatik hisoblab yozib qo'yadi.
 */
export const startDebtCron = () => {
    logger.info('💸 Debt Generator Cron Job Started');

    setInterval(async () => {
        const now = new Date();

        // Agar oyning 1-kunida va soat tungi 1 da ishlayotgan bo'lsa
        if (now.getDate() === 1 && now.getHours() === 1) {
            try {
                await generateMonthlyDebts(now);
            } catch (error) {
                logger.error('Avtomatik qarz yaratishda xatolik:', error);
            }
        }
    }, 60 * 60 * 1000); // Har soatda tekshiradi
};

export const generateMonthlyDebts = async (date: Date) => {
    // Joriy hisobot oyi (YYYY-MM formati)
    const periodMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Tizim avval generatsiya qilganligini (dublikat oldini olish uchun) tekshirish
    // added_by = 0 tizim o'zi qo'shganini bildiradi
    const existing = await query(`
        SELECT 1 FROM payment_debts 
        WHERE period_month = $1 AND added_by = 0 LIMIT 1
    `, [periodMonth]);

    if (existing.length > 0) {
        logger.debug(`${periodMonth} uchun avtomatik qarzdorlik allaqachon yaratilgan.`);
        return;
    }

    logger.info(`🔄 ${periodMonth} oyi uchun qarzdorliklarni generatsiya qilish boshlandi...`);

    // Aktiv enrolments bo'yicha qarz hisoblash va INSERT qilish
    // Kurs narxi - (Kurs narxi * discount_pct / 100) = amount_due
    const res = await query(`
        INSERT INTO payment_debts (student_id, enrollment_id, period_month, amount_due, status, added_by)
        SELECT 
            e.student_id, 
            e.id as enrollment_id, 
            $1 as period_month,
            (c.price_per_month * (1 - COALESCE(e.discount_pct, 0) / 100.0)) as amount_due,
            'unpaid' as status,
            0 as added_by
        FROM group_enrollments e
        JOIN groups g ON e.group_id = g.id AND g.status = 'active'
        JOIN courses c ON g.course_id = c.id
        WHERE e.status = 'active'
          AND NOT EXISTS (
              SELECT 1 FROM payment_debts pd 
              WHERE pd.enrollment_id = e.id AND pd.period_month = $1
          )
        RETURNING id
    `, [periodMonth]);

    logger.info(`✅ ${periodMonth} oyi uchun jami ${res.length} ta yangi qarzdorlik muvaffaqiyatli yaratildi.`);
};
