import { createApp } from './app';
import { connectDatabase, pool, query } from './config/database';
import { ENV } from './config/env';
import { logger } from './utils/logger.util';
import { startDebtCron } from './cron/debt.cron';
import { socketService } from './services/socket.service';
import { createBot } from './bot/bot';
import { execSync } from 'child_process';
import * as net from 'net';

// ============================================================
// SERVER ENTRY POINT — Graceful Startup & Shutdown
// ============================================================

/**
 * Port band ekanligini tekshiradi
 */
function isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', () => resolve(true))
            .once('listening', () => {
                tester.close(() => resolve(false));
            })
            .listen(port, '127.0.0.1');
    });
}

/**
 * Windows: netlstat + taskkill orqali portni bo'shatadi
 */
function freePort(port: number): void {
    try {
        // Windows: netstat orqali portni ishlatuvchi PID topish va o'chirish
        const output = execSync(
            `netstat -ano | findstr :${port}`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        );

        const lines = output.split('\n').filter(l => l.includes('LISTENING'));
        const pids = new Set<string>();

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') pids.add(pid);
        }

        for (const pid of pids) {
            try {
                execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
                logger.info(`Port ${port} ni band qilgan jarayon (PID: ${pid}) to'xtatildi`);
            } catch {
                // Already exited
            }
        }
    } catch {
        // netstat topilmasa yoki port bo'sh bo'lsa — muammo yo'q
    }
}

async function bootstrap(): Promise<void> {
    // Demo accountlarni kiritish (terminal xatoligi sababli server startupga qo'shildi)
    try {
        logger.info('🔄 Ma\'lumotlar bazasini sozlash boshlandi...');
        // setup-db.js migratsiyalarni va adminni tekshiradi
        execSync('node setup-db.js', { stdio: 'inherit' });
    } catch (err) {
        logger.error('Failed to run setup-db.js:', err);
    }

    try {
        logger.info('🔄 Running demo seed script...');
        execSync('node seed-demo.js', { stdio: 'inherit' });
    } catch (err) {
        logger.error('Failed to run demo seed:', err);
    }

    // 1. Portni tekshirish va agar band bo'lsa — bo'shatish
    const port = ENV.PORT;
    if (await isPortInUse(port)) {
        logger.warn(`⚠️ Port ${port} band. Eski jarayonni o'chirish...`);
        freePort(port);
        // Jarayon o'chirilishini kutish
        await new Promise(r => setTimeout(r, 1500));
    }

    // 2. Ma'lumotlar bazasiga ulanish
    await connectDatabase();

    // 3. Express ilovasini yaratish
    const app = createApp();

    // 4. Serverni ishga tushirish
    const server = app.listen(port, () => {
        logger.info(`🚀 Ziyo Chashmasi ERP serveri ishga tushdi`);
        logger.info(`📍 http://localhost:${port}`);
        logger.info(`🌍 Muhit: ${ENV.NODE_ENV}`);
        // Cron-joblarni boshlash
        startDebtCron();
    });

    // 5. Socket.io ishga tushirish
    socketService.initialize(server);

    // Telegram Bot ishga tushirish (async IIFE — await ishlatish uchun)
    void (async () => {
        try {
            const settings = await query<{ key: string; value: string }>(
                `SELECT key, value FROM system_settings WHERE key IN ('telegram_bot_token', 'telegram_chat_id')`
            );
            const settingsMap: Record<string, string> = {};
            settings.forEach((s) => { settingsMap[s.key] = s.value; });
            const botToken = settingsMap['telegram_bot_token'] || process.env.TELEGRAM_BOT_TOKEN || '';
            const adminChatId = settingsMap['telegram_chat_id'] || process.env.TELEGRAM_ADMIN_CHAT_ID || '';
            if (botToken) {
                createBot(botToken, adminChatId);
                logger.info('🤖 Telegram Bot muvaffaqiyatli ishga tushdi');
            } else {
                logger.info('ℹ️ Telegram Bot tokeni sozlanmagan. Sozlamalar bo\'limidan kiritishingiz mumkin.');
            }
        } catch (err) {
            logger.warn('⚠️ Telegram Bot ishga tushmadi (Sozlamalarni tekshiring)');
        }
    })();

    server.on('error', async (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            logger.warn(`Port ${port} hali band. Qayta urinish (1.5s)...`);
            freePort(port);
            await new Promise(r => setTimeout(r, 1500));
            server.listen(port);
        } else {
            logger.error('Server xatosi:', err);
            process.exit(1);
        }
    });

    // ---- GRACEFUL SHUTDOWN ----
    const shutdown = async (signal: string): Promise<void> => {
        logger.info(`${signal} signali qabul qilindi. Server yopilmoqda...`);

        server.close(async () => {
            logger.info('HTTP server yopildi');
            await pool.end();
            logger.info('📊 PostgreSQL ulanishlari yopildi');
            process.exit(0);
        });

        setTimeout(() => {
            logger.error('Majburiy to\'xtatish (10s timeout)');
            process.exit(1);
        }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
        logger.error('Ushlashilmagan Promise xatosi:', reason);
    });
}

bootstrap().catch((error) => {
    console.error('Server ishga tushmadi:', error);
    process.exit(1);
});
