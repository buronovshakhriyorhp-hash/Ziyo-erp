import { Router } from 'express';
import { botController } from '../controllers/bot.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

// ============================================================
// BOT ROUTES
// Admin faqat foydalana oladi
// ============================================================

const router = Router();

// Barcha bot API endpointlari autentifikatsiya talab qiladi
router.use(authenticate);

// Admin operatsiyalar
router.post('/broadcast', botController.broadcast.bind(botController));
router.post('/new-course', botController.announceNewCourse.bind(botController));
router.get('/registrations', botController.getRegistrations.bind(botController));
router.patch('/registrations/:id', botController.updateRegistration.bind(botController));
router.get('/announcements', botController.getAnnouncements.bind(botController));
router.get('/stats', botController.getStats.bind(botController));

export default router;
