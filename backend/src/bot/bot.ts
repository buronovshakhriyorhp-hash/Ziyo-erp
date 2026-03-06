import TelegramBot from 'node-telegram-bot-api';
import { query } from '../config/database';
import { logger } from '../utils/logger.util';
import { botState } from './bot-state.service';
import { botUserRepository } from '../repositories/bot-user.repository';

// ============================================================
// ZIYO EDUCATION BOT — To'liq interaktiv Telegram Bot
// 15+ funksiya: Kurslar, Ro'yxat, E'lon, Statistika, Chat…
// ============================================================

let bot: TelegramBot | null = null;
let ADMIN_CHAT_ID = '';

// ──────────────────────────────────────────────────────────
// TILLAR (Uzbekcha va Ruscha)
// ──────────────────────────────────────────────────────────
const T = {
    uz: {
        welcome: (name: string) =>
            `🎓 <b>Ziyo Chashmasi O'quv Markaziga xush kelibsiz, ${name}!</b>\n\n` +
            `Bu bot orqali siz:\n` +
            `✅ Kurslarimiz haqida ma'lumot olishingiz\n` +
            `✅ Kursga ro'yxatdan o'tishingiz\n` +
            `✅ O'z holatingizni kuzatishingiz\n` +
            `✅ Admin bilan muloqot qilishingiz mumkin\n\n` +
            `👇 Quyidagi menyudan tanlang:`,
        menu_courses: '📚 Kurslar',
        menu_register: '📝 Ro\'yxatdan o\'tish',
        menu_prices: '💰 Narxlar',
        menu_schedule: '📅 Jadval',
        menu_news: '📢 E\'lonlar',
        menu_status: '📊 Mening holatim',
        menu_contact: '📞 Bog\'lanish',
        menu_notifications: '🔔 Eslatmalar',
        menu_language: '🌐 Til',
        menu_faq: '❓ FAQ',
        menu_feedback: '📝 Fikr-mulohaza',
        menu_certificate: '🎓 Sertifikat',
        menu_chat: '💬 Admin bilan muloqot',
        menu_back: '⬅️ Orqaga',
        courses_title: '📚 <b>Bizning kurslar:</b>\n\n',
        no_courses: 'Hozircha aktiv kurslar yo\'q.',
        register_start: '📝 <b>Kursga ro\'yxatdan o\'tish</b>\n\nIlk qadam: to\'liq ismingizni kiriting:\n<i>(Masalan: Alixon Toshmatov)</i>',
        register_phone: '📞 Telefon raqamingizni kiriting:\n<i>(Masalan: +998901234567)</i>',
        register_choose_course: '📚 Qaysi kursni tanlaysiz?',
        register_success: (name: string, course: string) =>
            `✅ <b>Ro'yxatdan o'tish muvaffaqiyatli!</b>\n\n` +
            `👤 Ism: <b>${name}</b>\n` +
            `📚 Kurs: <b>${course}</b>\n\n` +
            `⏳ Menejerimiz tez orada siz bilan bog'lanadi!\n` +
            `📞 Savollar uchun: <b>+998 99 123 45 67</b>`,
        contact_info:
            `📞 <b>Bog'lanish ma'lumotlari</b>\n\n` +
            `🏢 <b>Manzil:</b> Toshkent sh., Chilonzor t.\n` +
            `📱 <b>Telefon:</b> +998 99 123 45 67\n` +
            `📱 <b>Telefon 2:</b> +998 90 123 45 67\n` +
            `🕘 <b>Ish vaqti:</b> Du-Sha, 08:00–20:00\n` +
            `✉️ <b>Email:</b> info@ziyochashmasi.uz\n` +
            `🌐 <b>Veb-sayt:</b> ziyochashmasi.uz\n\n` +
            `📍 <b>Lokatsiya:</b>`,
        notifications_on: '✅ Eslatmalar <b>yoqildi</b>! Siz barcha yangiliklar va to\'lov eslatmalarini olasiz.',
        notifications_off: '🔕 Eslatmalar <b>o\'chirildi</b>.',
        faq_text:
            `❓ <b>Tez-tez so'raladigan savollar</b>\n\n` +
            `<b>1. Kurslar qancha davom etadi?</b>\n` +
            `📌 Kurslar 3-6 oy davom etadi, kursga qarab farq qiladi.\n\n` +
            `<b>2. To'lov qanday amalga oshiriladi?</b>\n` +
            `📌 Har oyda naqd yoki plastik karta orqali.\n\n` +
            `<b>3. Darslar qachon boshlanadi?</b>\n` +
            `📌 Har oy boshida yangi guruhlar boshlanadi.\n\n` +
            `<b>4. Trial (sinov) dars bormi?</b>\n` +
            `📌 Ha, birinchi dars bepul!\n\n` +
            `<b>5. Sertifikat beriladimi?</b>\n` +
            `📌 Ha, kursni tugataganlar sertifikat oladi.\n\n` +
            `<b>6. Yoshi nechadan?</b>\n` +
            `📌 5 yoshdan kattalar uchun kurslar mavjud.`,
        feedback_rating: '⭐ <b>Fikr-mulohaza</b>\n\nXizmatimizga baho bering (1-5):',
        feedback_comment: 'Mulohazangizni yozing (ixtiyoriy, o\'tkazib yuborish uchun /skip bosing):',
        feedback_thanks: '🙏 <b>Fikringiz uchun rahmat!</b>\n\nSiz bizga juda katta yordam berdingiz.',
        certificate_name: '🎓 <b>Sertifikat so\'rash</b>\n\nTo\'liq ism va familiyangizni kiriting:',
        certificate_sent: '✅ Sertifikat so\'rovingiz qabul qilindi!\n⏳ 2-3 ish kuni ichida tayyorlanadi.',
        chat_start: '💬 <b>Admin bilan muloqot</b>\n\nXabaringizni yozing, admin tez orada javob beradi:',
        chat_sent: '✅ Xabaringiz adminga yuborildi! Javobni bu yerda olasiz.',
        status_not_found:
            '📊 <b>Mening holatim</b>\n\n' +
            '⚠️ Siz hali hech qaysi kursga yozilmagan ko\'rinasiz.\n\n' +
            '📝 Ro\'yxatdan o\'tish uchun menyu → <b>📝 Ro\'yxatdan o\'tish</b>',
        action_cancelled: '❌ Amal bekor qilindi.',
        invalid_phone: '⚠️ Noto\'g\'ri telefon raqam. Qayta kiriting:\n<i>(Masalan: +998901234567)</i>',
        lang_changed: '✅ Til o\'zbekchaga o\'zgartirildi!',
        prices_title: '💰 <b>Kurslar narxi:</b>\n\n',
        schedule_title: '📅 <b>Dars jadvali:</b>\n\n',
        no_schedule: 'Jadval hozircha mavjud emas.',
    },
    ru: {
        welcome: (name: string) =>
            `🎓 <b>Добро пожаловать в учебный центр Ziyo Chashmasi, ${name}!</b>\n\n` +
            `Через этого бота вы можете:\n` +
            `✅ Узнать о наших курсах\n` +
            `✅ Записаться на курс\n` +
            `✅ Отслеживать свой статус\n` +
            `✅ Общаться с администратором\n\n` +
            `👇 Выберите из меню ниже:`,
        menu_courses: '📚 Курсы',
        menu_register: '📝 Регистрация',
        menu_prices: '💰 Цены',
        menu_schedule: '📅 Расписание',
        menu_news: '📢 Объявления',
        menu_status: '📊 Мой статус',
        menu_contact: '📞 Контакты',
        menu_notifications: '🔔 Уведомления',
        menu_language: '🌐 Язык',
        menu_faq: '❓ FAQ',
        menu_feedback: '📝 Отзыв',
        menu_certificate: '🎓 Сертификат',
        menu_chat: '💬 Написать администратору',
        menu_back: '⬅️ Назад',
        courses_title: '📚 <b>Наши курсы:</b>\n\n',
        no_courses: 'Активных курсов пока нет.',
        register_start: '📝 <b>Регистрация на курс</b>\n\nШаг 1: введите ваше полное имя:',
        register_phone: '📞 Введите ваш номер телефона:\n<i>(Например: +998901234567)</i>',
        register_choose_course: '📚 Выберите курс:',
        register_success: (name: string, course: string) =>
            `✅ <b>Регистрация прошла успешно!</b>\n\n` +
            `👤 Имя: <b>${name}</b>\n` +
            `📚 Курс: <b>${course}</b>\n\n` +
            `⏳ Наш менеджер свяжется с вами в ближайшее время!\n` +
            `📞 По вопросам: <b>+998 99 123 45 67</b>`,
        contact_info:
            `📞 <b>Контактная информация</b>\n\n` +
            `🏢 <b>Адрес:</b> г. Ташкент, Чиланзарский р-он\n` +
            `📱 <b>Телефон:</b> +998 99 123 45 67\n` +
            `📱 <b>Телефон 2:</b> +998 90 123 45 67\n` +
            `🕘 <b>Часы работы:</b> Пн-Сб, 08:00–20:00\n` +
            `✉️ <b>Email:</b> info@ziyochashmasi.uz\n` +
            `🌐 <b>Сайт:</b> ziyochashmasi.uz\n\n` +
            `📍 <b>Локация:</b>`,
        notifications_on: '✅ Уведомления <b>включены</b>!',
        notifications_off: '🔕 Уведомления <b>отключены</b>.',
        faq_text:
            `❓ <b>Часто задаваемые вопросы</b>\n\n` +
            `<b>1. Сколько длится курс?</b>\n` +
            `📌 3-6 месяцев в зависимости от курса.\n\n` +
            `<b>2. Как оплачивать?</b>\n` +
            `📌 Ежемесячно наличными или картой.\n\n` +
            `<b>3. Когда начинаются занятия?</b>\n` +
            `📌 Новые группы начинаются каждый месяц.\n\n` +
            `<b>4. Есть ли пробный урок?</b>\n` +
            `📌 Да, первый урок бесплатный!\n\n` +
            `<b>5. Выдаётся ли сертификат?</b>\n` +
            `📌 Да, выпускникам выдаётся сертификат.\n\n` +
            `<b>6. С какого возраста?</b>\n` +
            `📌 Есть курсы для детей от 5 лет и взрослых.`,
        feedback_rating: '⭐ <b>Оставить отзыв</b>\n\nОцените наш сервис (1-5):',
        feedback_comment: 'Напишите комментарий (необязательно, /skip чтобы пропустить):',
        feedback_thanks: '🙏 <b>Спасибо за ваш отзыв!</b>',
        certificate_name: '🎓 <b>Запрос сертификата</b>\n\nВведите ваше полное имя:',
        certificate_sent: '✅ Ваш запрос принят!\n⏳ Сертификат будет готов в течение 2-3 рабочих дней.',
        chat_start: '💬 <b>Написать администратору</b>\n\nВведите ваше сообщение:',
        chat_sent: '✅ Ваше сообщение отправлено администратору! Ответ получите здесь.',
        status_not_found:
            '📊 <b>Мой статус</b>\n\n' +
            '⚠️ Вы ещё не записаны ни на один курс.\n\n' +
            '📝 Для регистрации: меню → <b>📝 Регистрация</b>',
        action_cancelled: '❌ Действие отменено.',
        invalid_phone: '⚠️ Неверный номер телефона. Введите снова:',
        lang_changed: '✅ Язык изменён на русский!',
        prices_title: '💰 <b>Цены на курсы:</b>\n\n',
        schedule_title: '📅 <b>Расписание занятий:</b>\n\n',
        no_schedule: 'Расписание пока не доступно.',
    },
};

// ──────────────────────────────────────────────────────────
// YORDAMCHI FUNKSIYALAR
// ──────────────────────────────────────────────────────────

function t(chatId: number, key: keyof typeof T.uz): any {
    const lang = botState.get(chatId).language;
    return T[lang][key];
}

// Asosiy menyu klaviaturasi
function mainKeyboard(chatId: number): TelegramBot.ReplyKeyboardMarkup {
    const l = botState.get(chatId).language;
    const tx = T[l];
    return {
        keyboard: [
            [{ text: tx.menu_courses }, { text: tx.menu_register }],
            [{ text: tx.menu_prices }, { text: tx.menu_schedule }],
            [{ text: tx.menu_status }, { text: tx.menu_news }],
            [{ text: tx.menu_faq }, { text: tx.menu_feedback }],
            [{ text: tx.menu_certificate }, { text: tx.menu_chat }],
            [{ text: tx.menu_contact }, { text: tx.menu_notifications }],
            [{ text: tx.menu_language }],
        ],
        resize_keyboard: true,
        is_persistent: true,
    };
}

// Kurs tanlash inline klaviaturasi
async function courseInlineKeyboard(lang: 'uz' | 'ru'): Promise<TelegramBot.InlineKeyboardMarkup> {
    try {
        const courses = await query<{ id: number; name: string; price_per_month: string }>(
            `SELECT c.id, c.name, c.price_per_month
             FROM courses c
             JOIN subjects s ON s.id = c.subject_id
             WHERE c.is_active = true
             ORDER BY s.name, c.name
             LIMIT 20`
        );
        const buttons = courses.map(c => ([{
            text: `${c.name} — ${parseInt(c.price_per_month).toLocaleString()} so'm`,
            callback_data: `reg_course:${c.id}:${c.name}`
        }]));
        buttons.push([{ text: lang === 'uz' ? '❓ Hali bilmayman' : '❓ Ещё не решил(а)', callback_data: 'reg_course:0:Aniqlanmagan' }]);
        return { inline_keyboard: buttons };
    } catch {
        return { inline_keyboard: [[{ text: lang === 'uz' ? 'Umumiy kurs' : 'Общий курс', callback_data: 'reg_course:0:Umumiy' }]] };
    }
}

// Til tanlash inline klaviaturasi
function langKeyboard(): TelegramBot.InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '🇺🇿 O\'zbek tili', callback_data: 'lang:uz' },
                { text: '🇷🇺 Русский язык', callback_data: 'lang:ru' },
            ],
        ],
    };
}

// Rating klaviaturasi
function ratingKeyboard(lang: 'uz' | 'ru'): TelegramBot.InlineKeyboardMarkup {
    return {
        inline_keyboard: [[
            { text: '⭐', callback_data: 'rating:1' },
            { text: '⭐⭐', callback_data: 'rating:2' },
            { text: '⭐⭐⭐', callback_data: 'rating:3' },
            { text: '⭐⭐⭐⭐', callback_data: 'rating:4' },
            { text: '⭐⭐⭐⭐⭐', callback_data: 'rating:5' },
        ]],
    };
}

// Telefon raqamni tekshirish
function isValidPhone(phone: string): boolean {
    return /^[\+]?[0-9]{9,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Foydalanuvchini ro'yxatga olish va qaytarish
async function ensureUser(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const from = msg.from!;
    try {
        const user = await botUserRepository.upsertUser({
            telegramId: chatId,
            username: from.username,
            firstName: from.first_name || 'Foydalanuvchi',
            lastName: from.last_name,
        });
        botState.setLanguage(chatId, user.language);
    } catch {
        // Bazaga ulanolmasa silence
    }
}

// ──────────────────────────────────────────────────────────
// BOT YARATISH VA HANDLERLAR
// ──────────────────────────────────────────────────────────

export function createBot(token: string, adminChatId: string): TelegramBot {
    ADMIN_CHAT_ID = adminChatId;

    // Polling rejimida ishlaydi (webhook ham qo'shish mumkin)
    bot = new TelegramBot(token, { polling: true });
    logger.info('🤖 Telegram Bot polling rejimida ishga tushdi!');

    // ── /start ─────────────────────────────────────────────
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        await ensureUser(msg);
        const name = msg.from?.first_name || 'Foydalanuvchi';
        await bot!.sendMessage(chatId, T.uz.welcome(name), {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    });

    // ── /cancel, /bekor ───────────────────────────────────
    bot.onText(/\/(cancel|bekor|отмена)/, async (msg) => {
        const chatId = msg.chat.id;
        botState.reset(chatId);
        await bot!.sendMessage(chatId, t(chatId, 'action_cancelled'), {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    });

    // ── /admin — Admin buyruqlari ─────────────────────────
    bot.onText(/\/admin/, async (msg) => {
        const chatId = msg.chat.id;
        if (String(chatId) !== ADMIN_CHAT_ID) return;
        await bot!.sendMessage(chatId,
            `🔧 <b>Admin Panel</b>\n\n` +
            `/stats — Kunlik statistika\n` +
            `/registrations — Yangi so'rovlar\n` +
            `/broadcast [xabar] — Barchaga yuborish\n` +
            `/newcourse [kurs nomi] — Yangi kurs e'loni`,
            { parse_mode: 'HTML' }
        );
    });

    // ── /stats — Admin statistika ─────────────────────────
    bot.onText(/\/stats/, async (msg) => {
        const chatId = msg.chat.id;
        if (String(chatId) !== ADMIN_CHAT_ID) return;
        try {
            const [totalUsers, todayReg] = await Promise.all([
                botUserRepository.getTotalUsers(),
                botUserRepository.getTodayRegistrations(),
            ]);
            const paymentRows = await query<{ total: string }>(
                `SELECT COALESCE(SUM(amount), 0) AS total FROM student_payments WHERE created_at::date = CURRENT_DATE`
            );
            const todayPayment = parseInt(paymentRows[0]?.total || '0');

            const studRows = await query<{ count: string }>(
                `SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true`
            );
            const totalStudents = parseInt(studRows[0]?.count || '0');

            await bot!.sendMessage(chatId,
                `📈 <b>Bugungi statistika</b>\n\n` +
                `👥 Jami bot foydalanuvchilari: <b>${totalUsers}</b>\n` +
                `📝 Bugungi so'rovlar: <b>${todayReg}</b>\n` +
                `💰 Bugungi to'lovlar: <b>${todayPayment.toLocaleString()} so'm</b>\n` +
                `🎓 Aktiv talabalar: <b>${totalStudents}</b>`,
                { parse_mode: 'HTML' }
            );
        } catch {
            await bot!.sendMessage(chatId, '❌ Ma\'lumot olishda xato.');
        }
    });

    // ── /registrations — Yangi so'rovlar ─────────────────
    bot.onText(/\/registrations/, async (msg) => {
        const chatId = msg.chat.id;
        if (String(chatId) !== ADMIN_CHAT_ID) return;
        try {
            const regs = await botUserRepository.getPendingRegistrations();
            if (!regs.length) {
                await bot!.sendMessage(chatId, '✅ Yangi kutayotgan so\'rovlar yo\'q.');
                return;
            }
            let text = `📋 <b>Kutayotgan so'rovlar (${regs.length} ta):</b>\n\n`;
            regs.slice(0, 10).forEach((r, i) => {
                text += `${i + 1}. <b>${r.fullName}</b>\n` +
                    `   📞 ${r.phone}\n` +
                    `   📚 ${r.courseName || 'Aniqlanmagan'}\n` +
                    `   ⏰ ${new Date(r.createdAt).toLocaleDateString('uz-UZ')}\n` +
                    `   🔗 Telegram: tg://user?id=${r.telegramId}\n\n`;
            });
            await bot!.sendMessage(chatId, text, { parse_mode: 'HTML' });
        } catch {
            await bot!.sendMessage(chatId, '❌ Xato.');
        }
    });

    // ── /broadcast [text] — Barchaga yuborish ─────────────
    bot.onText(/\/broadcast (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (String(chatId) !== ADMIN_CHAT_ID) return;
        const text = match![1];
        await sendBroadcast(text);
        await bot!.sendMessage(chatId, '✅ Broadcast yuborildi!');
    });

    // ── /newcourse [name] — Yangi kurs e'loni ─────────────
    bot.onText(/\/newcourse (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (String(chatId) !== ADMIN_CHAT_ID) return;
        const courseName = match![1];
        await notifyNewCourse(courseName);
        await bot!.sendMessage(chatId, `✅ "${courseName}" kursi haqida e'lon yuborildi!`);
    });

    // ──────────────────────────────────────────────────────
    // MATN HANDLERLARI (Asosiy Menyu Tugmalari)
    // ──────────────────────────────────────────────────────
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || '';
        if (!msg.text || msg.text.startsWith('/')) return;

        await ensureUser(msg);
        const session = botState.get(chatId);
        const lang = session.language;
        const tx = T[lang];

        // ── Joriy amal bo'yicha qadam ─────────────────────

        if (session.action === 'registration_name') {
            if (text.trim().length < 3) {
                await bot!.sendMessage(chatId, '⚠️ Ism kamida 3 harf bo\'lishi kerak. Qayta kiriting:');
                return;
            }
            botState.setData(chatId, 'name', text.trim());
            botState.setAction(chatId, 'registration_phone');
            await bot!.sendMessage(chatId, tx.register_phone, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [[{ text: '📱 Telefon raqamimni ulash', request_contact: true }], [{ text: tx.menu_back }]],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                }
            });
            return;
        }

        if (session.action === 'registration_phone') {
            if (!isValidPhone(text)) {
                await bot!.sendMessage(chatId, tx.invalid_phone, { parse_mode: 'HTML' });
                return;
            }
            botState.setData(chatId, 'phone', text.trim());
            botState.setAction(chatId, 'registration_course');
            await bot!.sendMessage(chatId, tx.register_choose_course, {
                parse_mode: 'HTML',
                reply_markup: await courseInlineKeyboard(lang),
            });
            return;
        }

        if (session.action === 'feedback_comment') {
            const rating = session.data.rating as number;
            const comment = text === '/skip' ? '' : text;
            await saveAndNotifyFeedback(chatId, msg.from?.first_name || '', rating, comment);
            botState.reset(chatId);
            await bot!.sendMessage(chatId, tx.feedback_thanks, {
                parse_mode: 'HTML',
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        if (session.action === 'certificate_name') {
            const fullName = text.trim();
            botState.reset(chatId);
            // Admin ga yuborish
            if (ADMIN_CHAT_ID) {
                await bot!.sendMessage(ADMIN_CHAT_ID,
                    `🎓 <b>Sertifikat so'rovi</b>\n\n` +
                    `👤 Ism: <b>${fullName}</b>\n` +
                    `🆔 Telegram ID: ${chatId}\n` +
                    `📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}`,
                    { parse_mode: 'HTML' }
                );
            }
            await bot!.sendMessage(chatId, tx.certificate_sent, {
                parse_mode: 'HTML',
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        if (session.action === 'contact_admin') {
            const userMsg = text.trim();
            botState.reset(chatId);
            if (ADMIN_CHAT_ID) {
                await bot!.sendMessage(ADMIN_CHAT_ID,
                    `💬 <b>Foydalanuvchi xabari</b>\n\n` +
                    `👤 ${msg.from?.first_name || ''} ${msg.from?.last_name || ''}` +
                    (msg.from?.username ? ` (@${msg.from.username})` : '') + '\n' +
                    `🆔 Telegram ID: <code>${chatId}</code>\n\n` +
                    `💬 <b>Xabar:</b>\n${userMsg}\n\n` +
                    `📩 <i>Javob berish uchun: /reply_${chatId} [xabar]</i>`,
                    { parse_mode: 'HTML' }
                );
            }
            await bot!.sendMessage(chatId, tx.chat_sent, {
                parse_mode: 'HTML',
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        if (session.action === 'broadcast_admin') {
            if (String(chatId) !== ADMIN_CHAT_ID) {
                botState.reset(chatId);
                return;
            }
            await sendBroadcast(text);
            botState.reset(chatId);
            await bot!.sendMessage(chatId, '✅ Broadcast yuborildi!', { reply_markup: mainKeyboard(chatId) });
            return;
        }

        // ── Menyu tugmalari ───────────────────────────────

        // 📚 Kurslar
        if (text === tx.menu_courses) {
            await handleCourses(chatId, lang);
            return;
        }

        // 📝 Ro'yxatdan o'tish
        if (text === tx.menu_register) {
            botState.setAction(chatId, 'registration_name');
            await bot!.sendMessage(chatId, tx.register_start, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [[{ text: tx.menu_back }]],
                    resize_keyboard: true,
                }
            });
            return;
        }

        // 💰 Narxlar
        if (text === tx.menu_prices) {
            await handlePrices(chatId, lang);
            return;
        }

        // 📅 Jadval
        if (text === tx.menu_schedule) {
            await handleSchedule(chatId, lang);
            return;
        }

        // 📊 Mening holatim
        if (text === tx.menu_status) {
            await handleStatus(chatId, lang);
            return;
        }

        // 📢 E'lonlar
        if (text === tx.menu_news) {
            await handleNews(chatId, lang);
            return;
        }

        // 📞 Bog'lanish
        if (text === tx.menu_contact) {
            await bot!.sendMessage(chatId, tx.contact_info, { parse_mode: 'HTML' });
            // Lokatsiya yuborish
            await bot!.sendLocation(chatId, 41.2995, 69.2401); // Toshkent markazi (manzilga qarab o'zgartiring)
            return;
        }

        // 🔔 Eslatmalar
        if (text === tx.menu_notifications) {
            try {
                const enabled = await botUserRepository.toggleNotifications(chatId);
                await bot!.sendMessage(chatId,
                    enabled ? tx.notifications_on : tx.notifications_off,
                    { parse_mode: 'HTML', reply_markup: mainKeyboard(chatId) }
                );
            } catch {
                await bot!.sendMessage(chatId, '⚠️ Xato. Keyinroq qayta urining.');
            }
            return;
        }

        // 🌐 Til
        if (text === tx.menu_language) {
            await bot!.sendMessage(chatId, '🌐 Tilni tanlang / Выберите язык:', {
                reply_markup: langKeyboard(),
            });
            return;
        }

        // ❓ FAQ
        if (text === tx.menu_faq) {
            await bot!.sendMessage(chatId, tx.faq_text, {
                parse_mode: 'HTML',
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        // 📝 Fikr-mulohaza
        if (text === tx.menu_feedback) {
            botState.setAction(chatId, 'feedback_rating');
            await bot!.sendMessage(chatId, tx.feedback_rating, {
                parse_mode: 'HTML',
                reply_markup: ratingKeyboard(lang),
            });
            return;
        }

        // 🎓 Sertifikat
        if (text === tx.menu_certificate) {
            botState.setAction(chatId, 'certificate_name');
            await bot!.sendMessage(chatId, tx.certificate_name, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [[{ text: tx.menu_back }]],
                    resize_keyboard: true,
                }
            });
            return;
        }

        // 💬 Admin bilan muloqot
        if (text === tx.menu_chat) {
            botState.setAction(chatId, 'contact_admin');
            await bot!.sendMessage(chatId, tx.chat_start, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [[{ text: tx.menu_back }], [{ text: '/skip' }]],
                    resize_keyboard: true,
                }
            });
            return;
        }

        // ⬅️ Orqaga
        if (text === tx.menu_back) {
            botState.reset(chatId);
            await bot!.sendMessage(chatId, '🏠 Asosiy menyu:', {
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        // ── Admin: reply_ID ──────────────────────────────
        if (text.startsWith('/reply_') && String(chatId) === ADMIN_CHAT_ID) {
            const parts = text.split(' ');
            const targetId = parseInt(parts[0].replace('/reply_', ''));
            const replyText = parts.slice(1).join(' ');
            if (targetId && replyText) {
                await bot!.sendMessage(targetId,
                    `📩 <b>Admin javobi:</b>\n\n${replyText}`,
                    { parse_mode: 'HTML' }
                );
                await bot!.sendMessage(chatId, '✅ Javob yuborildi!');
            }
            return;
        }
    });

    // ── Contact (telefon raqam ulash) ─────────────────────
    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const session = botState.get(chatId);
        if (session.action !== 'registration_phone') return;

        const phone = msg.contact?.phone_number || '';
        botState.setData(chatId, 'phone', phone);
        botState.setAction(chatId, 'registration_course');
        const lang = session.language;
        await bot!.sendMessage(chatId, T[lang].register_choose_course, {
            parse_mode: 'HTML',
            reply_markup: await courseInlineKeyboard(lang),
        });
    });

    // ── Inline keyboard callback ───────────────────────────
    bot.on('callback_query', async (query) => {
        const chatId = query.message?.chat.id;
        if (!chatId) return;
        const data = query.data || '';
        const lang = botState.get(chatId).language;
        const tx = T[lang];

        await bot!.answerCallbackQuery(query.id);

        // Til tanlash
        if (data.startsWith('lang:')) {
            const newLang = data.split(':')[1] as 'uz' | 'ru';
            botState.setLanguage(chatId, newLang);
            try { await botUserRepository.updateLanguage(chatId, newLang); } catch { }
            await bot!.sendMessage(chatId,
                newLang === 'uz' ? T.uz.lang_changed : T.ru.lang_changed,
                { parse_mode: 'HTML', reply_markup: mainKeyboard(chatId) }
            );
            return;
        }

        // Kurs tanlash (registratsiya)
        if (data.startsWith('reg_course:')) {
            const parts = data.split(':');
            const courseId = parseInt(parts[1]);
            const courseName = parts.slice(2).join(':');
            const session = botState.get(chatId);
            const name = String(session.data.name || '');
            const phone = String(session.data.phone || '');

            if (!name || !phone) {
                botState.reset(chatId);
                await bot!.sendMessage(chatId, '⚠️ Xato. Qayta boshlang.', { reply_markup: mainKeyboard(chatId) });
                return;
            }

            try {
                await botUserRepository.createRegistration({
                    telegramId: chatId,
                    fullName: name,
                    phone,
                    courseId: courseId || undefined,
                    courseName,
                });

                // Admin ga xabar
                if (ADMIN_CHAT_ID) {
                    await bot!.sendMessage(ADMIN_CHAT_ID,
                        `🆕 <b>YANGI RO'YXATDAN O'TISH!</b>\n\n` +
                        `👤 Ism: <b>${name}</b>\n` +
                        `📞 Tel: <b>${phone}</b>\n` +
                        `📚 Kurs: <b>${courseName}</b>\n` +
                        `🆔 Telegram: tg://user?id=${chatId}\n` +
                        `⏰ ${new Date().toLocaleString('uz-UZ')}`,
                        { parse_mode: 'HTML' }
                    );
                }
            } catch (err) {
                logger.error('Bot registration error:', err);
            }

            botState.reset(chatId);
            await bot!.sendMessage(chatId, tx.register_success(name, courseName), {
                parse_mode: 'HTML',
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        // Reyting
        if (data.startsWith('rating:')) {
            const rating = parseInt(data.split(':')[1]);
            botState.setData(chatId, 'rating', rating);
            botState.setAction(chatId, 'feedback_comment');
            const stars = '⭐'.repeat(rating);
            await bot!.sendMessage(chatId,
                `${stars} <b>Bahoingiz: ${rating}/5</b>\n\n${tx.feedback_comment}`,
                { parse_mode: 'HTML' }
            );
            return;
        }
    });

    return bot;
}

// ──────────────────────────────────────────────────────────
// KURSLAR HANDLER
// ──────────────────────────────────────────────────────────
async function handleCourses(chatId: number, lang: 'uz' | 'ru'): Promise<void> {
    try {
        const courses = await query<{
            id: number; name: string; description: string;
            duration_months: number; lessons_per_week: number;
            price_per_month: string; level: string;
            subject_name: string; active_groups: number;
        }>(
            `SELECT c.id, c.name, c.description, c.duration_months,
                    c.lessons_per_week, c.price_per_month, c.level,
                    s.name AS subject_name,
                    COUNT(g.id) FILTER (WHERE g.status = 'active') AS active_groups
             FROM courses c
             JOIN subjects s ON s.id = c.subject_id
             LEFT JOIN groups g ON g.course_id = c.id
             WHERE c.is_active = true
             GROUP BY c.id, s.name
             ORDER BY s.name, c.name
             LIMIT 20`
        );

        if (!courses.length) {
            await bot!.sendMessage(chatId, T[lang].no_courses, { reply_markup: mainKeyboard(chatId) });
            return;
        }

        const levelIcons: Record<string, string> = {
            beginner: '🟢', intermediate: '🟡', advanced: '🔴', all: '🔵'
        };

        let text = T[lang].courses_title;
        courses.forEach((c, i) => {
            const icon = levelIcons[c.level] || '📚';
            text +=
                `${i + 1}. ${icon} <b>${c.name}</b>\n` +
                `   📁 ${c.subject_name}\n` +
                `   ⏱ ${c.duration_months} oy | ${c.lessons_per_week} dars/hafta\n` +
                `   💰 ${parseInt(c.price_per_month).toLocaleString()} so'm/oy\n` +
                `   👥 Aktiv guruhlar: ${c.active_groups || 0}\n\n`;
        });

        text += lang === 'uz'
            ? `📝 <b>Ro'yxatdan o'tish uchun «📝 Ro'yxatdan o'tish» tugmasini bosing.</b>`
            : `📝 <b>Для записи нажмите «📝 Регистрация».</b>`;

        await bot!.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    } catch (err) {
        logger.error('handleCourses error:', err);
        await bot!.sendMessage(chatId, T[lang].no_courses);
    }
}

// ──────────────────────────────────────────────────────────
// NARXLAR HANDLER
// ──────────────────────────────────────────────────────────
async function handlePrices(chatId: number, lang: 'uz' | 'ru'): Promise<void> {
    try {
        const courses = await query<{
            name: string; price_per_month: string;
            duration_months: number; subject_name: string;
        }>(
            `SELECT c.name, c.price_per_month, c.duration_months, s.name AS subject_name
             FROM courses c JOIN subjects s ON s.id = c.subject_id
             WHERE c.is_active = true ORDER BY c.price_per_month ASC LIMIT 20`
        );

        let text = T[lang].prices_title;
        courses.forEach(c => {
            const monthly = parseInt(c.price_per_month);
            const total = monthly * c.duration_months;
            text +=
                `📚 <b>${c.name}</b> (${c.subject_name})\n` +
                `   💰 ${monthly.toLocaleString()} so'm/oy\n` +
                `   📅 Jami ${c.duration_months} oy → <b>${total.toLocaleString()} so'm</b>\n\n`;
        });

        text += lang === 'uz'
            ? '💡 <i>Chegirmalar va to\'lov rejalari uchun menejerimizga murojaat qiling.</i>'
            : '💡 <i>Для скидок и рассрочки обратитесь к менеджеру.</i>';

        await bot!.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    } catch {
        await bot!.sendMessage(chatId, T[lang].no_courses);
    }
}

// ──────────────────────────────────────────────────────────
// JADVAL HANDLER
// ──────────────────────────────────────────────────────────
async function handleSchedule(chatId: number, lang: 'uz' | 'ru'): Promise<void> {
    try {
        const groups = await query<{
            name: string; course_name: string; teacher_name: string;
            schedule_days: string; start_time: string; status: string;
        }>(
            `SELECT g.name, c.name AS course_name,
                    CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
                    g.schedule_days, g.start_time, g.status
             FROM groups g
             JOIN courses c ON c.id = g.course_id
             LEFT JOIN users u ON u.id = g.teacher_id
             WHERE g.status IN ('active', 'forming')
             ORDER BY g.start_time
             LIMIT 15`
        );

        if (!groups.length) {
            await bot!.sendMessage(chatId, T[lang].schedule_title + T[lang].no_schedule, {
                parse_mode: 'HTML',
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        const statusIcon: Record<string, string> = { active: '✅', forming: '🔄', completed: '✔️' };

        let text = T[lang].schedule_title;
        groups.forEach(g => {
            const icon = statusIcon[g.status] || '📅';
            text +=
                `${icon} <b>${g.name}</b>\n` +
                `   📚 ${g.course_name}\n` +
                `   👨‍🏫 ${g.teacher_name || (lang === 'uz' ? 'Aniqlanmagan' : 'Не указан')}\n` +
                `   📅 ${g.schedule_days || ''} ${g.start_time ? '| ' + g.start_time : ''}\n\n`;
        });

        await bot!.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    } catch {
        await bot!.sendMessage(chatId, T[lang].no_schedule);
    }
}

// ──────────────────────────────────────────────────────────
// STATUS HANDLER (Talabaning holati)
// ──────────────────────────────────────────────────────────
async function handleStatus(chatId: number, lang: 'uz' | 'ru'): Promise<void> {
    try {
        const botUser = await botUserRepository.findByTelegramId(chatId);
        if (!botUser?.studentId) {
            // Yozilish so'rovi bo'lsa
            const regs = await query<{ full_name: string; course_name: string; status: string; created_at: Date }>(
                `SELECT full_name, course_name, status, created_at
                 FROM bot_registrations WHERE telegram_id = $1 ORDER BY created_at DESC LIMIT 3`,
                [chatId]
            );

            if (regs.length > 0) {
                const statusMap: Record<string, string> = {
                    pending: lang === 'uz' ? '⏳ Kutilmoqda' : '⏳ Ожидание',
                    contacted: lang === 'uz' ? '📞 Bog\'landi' : '📞 Связались',
                    enrolled: lang === 'uz' ? '✅ Yozildi' : '✅ Записан',
                    rejected: lang === 'uz' ? '❌ Rad etildi' : '❌ Отклонён',
                };
                let text = lang === 'uz'
                    ? `📊 <b>So'rovlaringiz holati:</b>\n\n`
                    : `📊 <b>Статус ваших заявок:</b>\n\n`;
                regs.forEach((r, i) => {
                    text += `${i + 1}. <b>${r.course_name || 'Kurs'}</b>\n` +
                        `   ${statusMap[r.status] || r.status}\n` +
                        `   📅 ${new Date(r.created_at).toLocaleDateString('uz-UZ')}\n\n`;
                });
                await bot!.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    reply_markup: mainKeyboard(chatId),
                });
            } else {
                await bot!.sendMessage(chatId, T[lang].status_not_found, {
                    parse_mode: 'HTML',
                    reply_markup: mainKeyboard(chatId),
                });
            }
            return;
        }

        // Student ID bor bo'lsa — to'liq ma'lumot
        const enrollments = await query<{
            group_name: string; course_name: string; balance: string;
            next_payment: string; status: string;
        }>(
            `SELECT g.name AS group_name, c.name AS course_name,
                    COALESCE(SUM(sp.amount), 0) - COALESCE(SUM(pd.amount_due), 0) AS balance,
                    MIN(pd.due_date) FILTER (WHERE pd.status = 'pending') AS next_payment,
                    ge.status
             FROM group_enrollments ge
             JOIN groups g ON g.id = ge.group_id
             JOIN courses c ON c.id = g.course_id
             LEFT JOIN student_payments sp ON sp.student_id = ge.student_id
             LEFT JOIN payment_debts pd ON pd.enrollment_id = ge.id
             WHERE ge.student_id = $1 AND ge.is_deleted = false
             GROUP BY g.name, c.name, ge.status`,
            [botUser.studentId]
        );

        if (!enrollments.length) {
            await bot!.sendMessage(chatId, T[lang].status_not_found, {
                parse_mode: 'HTML',
                reply_markup: mainKeyboard(chatId),
            });
            return;
        }

        let text = lang === 'uz' ? `📊 <b>Mening holatim:</b>\n\n` : `📊 <b>Мой статус:</b>\n\n`;
        enrollments.forEach(e => {
            const balance = parseFloat(e.balance);
            const balanceIcon = balance >= 0 ? '✅' : '⚠️';
            text +=
                `📚 <b>${e.course_name}</b> — ${e.group_name}\n` +
                `   ${balanceIcon} ${lang === 'uz' ? 'Balans' : 'Баланс'}: <b>${balance.toLocaleString()} so'm</b>\n` +
                (e.next_payment ? `   📅 ${lang === 'uz' ? 'Keyingi to\'lov' : 'Следующий платёж'}: <b>${e.next_payment}</b>\n` : '') +
                `\n`;
        });

        await bot!.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    } catch (err) {
        logger.error('handleStatus error:', err);
        await bot!.sendMessage(chatId, T[lang].status_not_found, {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    }
}

// ──────────────────────────────────────────────────────────
// E'LONLAR HANDLER
// ──────────────────────────────────────────────────────────
async function handleNews(chatId: number, lang: 'uz' | 'ru'): Promise<void> {
    try {
        const announcements = await botUserRepository.getRecentAnnouncements(5);
        if (!announcements.length) {
            await bot!.sendMessage(chatId,
                lang === 'uz' ? '📢 Hozircha e\'lonlar yo\'q.' : '📢 Объявлений пока нет.',
                { reply_markup: mainKeyboard(chatId) }
            );
            return;
        }

        let text = lang === 'uz' ? '📢 <b>So\'ngi e\'lonlar:</b>\n\n' : '📢 <b>Последние объявления:</b>\n\n';
        announcements.forEach((a, i) => {
            text += `${i + 1}. <b>${a.title}</b>\n${a.content}\n` +
                `📅 <i>${new Date(a.createdAt).toLocaleDateString('uz-UZ')}</i>\n\n`;
        });

        await bot!.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard(chatId),
        });
    } catch {
        await bot!.sendMessage(chatId, '⚠️ Xato yuz berdi.');
    }
}

// ──────────────────────────────────────────────────────────
// FEEDBACK SAQLASH
// ──────────────────────────────────────────────────────────
async function saveAndNotifyFeedback(
    chatId: number, userName: string, rating: number, comment: string
): Promise<void> {
    try {
        if (ADMIN_CHAT_ID) {
            const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
            await bot!.sendMessage(ADMIN_CHAT_ID,
                `📝 <b>Yangi Fikr-Mulohaza</b>\n\n` +
                `${stars} <b>(${rating}/5)</b>\n` +
                `👤 ${userName} (ID: ${chatId})\n` +
                (comment ? `💬 ${comment}` : ''),
                { parse_mode: 'HTML' }
            );
        }
    } catch { }
}

// ──────────────────────────────────────────────────────────
// BROADCAST — Barcha obunachilarga yuborish
// ──────────────────────────────────────────────────────────
export async function sendBroadcast(text: string): Promise<number> {
    if (!bot) return 0;
    let sent = 0;
    try {
        const subscribers = await botUserRepository.getAllSubscribers();
        for (const sub of subscribers) {
            try {
                await bot.sendMessage(sub.telegramId, text, { parse_mode: 'HTML' });
                sent++;
                await new Promise(r => setTimeout(r, 50)); // Rate limit
            } catch { }
        }
        // E'lonni saqlash
        await botUserRepository.createAnnouncement({
            title: text.substring(0, 50) + '...',
            content: text,
            sentCount: sent,
        });
    } catch (err) {
        logger.error('Broadcast error:', err);
    }
    return sent;
}

// ──────────────────────────────────────────────────────────
// YANGI KURS E'LONI
// ──────────────────────────────────────────────────────────
export async function notifyNewCourse(courseName: string): Promise<void> {
    const textUz =
        `🎉 <b>YANGI KURS OCHILDI!</b>\n\n` +
        `📚 <b>${courseName}</b>\n\n` +
        `Markazimizda yangi kurs ochildi!\n` +
        `📝 Ro'yxatdan o'tish uchun /start yuboring va «📝 Ro'yxatdan o'tish» tugmasini bosing.\n\n` +
        `📞 Batafsil: +998 99 123 45 67`;

    const textRu =
        `🎉 <b>НОВЫЙ КУРС ОТКРЫТ!</b>\n\n` +
        `📚 <b>${courseName}</b>\n\n` +
        `В нашем центре открылся новый курс!\n` +
        `📝 Для записи отправьте /start и нажмите «📝 Регистрация».\n\n` +
        `📞 Подробности: +998 99 123 45 67`;

    if (!bot) return;
    try {
        const subscribers = await botUserRepository.getAllSubscribers();
        for (const sub of subscribers) {
            try {
                const text = sub.language === 'ru' ? textRu : textUz;
                await bot.sendMessage(sub.telegramId, text, { parse_mode: 'HTML' });
                await new Promise(r => setTimeout(r, 50));
            } catch { }
        }
        await botUserRepository.createAnnouncement({
            title: `Yangi kurs: ${courseName}`,
            content: textUz,
            sentCount: subscribers.length,
        });
    } catch (err) {
        logger.error('notifyNewCourse error:', err);
    }
}

export { bot };
