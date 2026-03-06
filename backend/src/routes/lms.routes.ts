import { Router } from 'express';
import { LmsController } from '../controllers/lms.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

const router = Router();

// Hamma routelar uchun faqat tizimga kirganlar ruxsat etiladi
router.use(authenticate);

// O'quvchi gamification profili
router.get('/profile', LmsController.getGamificationProfile);

// Peshqadamlar (Leaderboard) - hamma kira olishi kerak (shaffoflik)
router.get('/leaderboard', LmsController.getLeaderboard);

// Kurs materiallarini tekshirish bilan o'qish (audit va RBAC tekshiruvi xizmat ichida)
router.get('/courses/:courseId/materials', authorize('student'), LmsController.getCourseMaterials);

// Uy vazifani topshirish (Faqat studentlar)
router.post('/materials/:materialId/submit', authorize('student'), LmsController.submitAssignment);

// --- Phase 6: Homework & Gamified Tasks ---
// O'qituvchi Group Tasks
router.get('/groups/:groupId/tasks', authorize('teacher', 'admin', 'manager'), LmsController.getGroupTasks);
router.post('/groups/tasks', authorize('teacher', 'admin'), LmsController.createGroupTask);
router.post('/tasks/submissions/:submissionId/grade', authorize('teacher', 'admin'), LmsController.gradeTask);

// O'quvchi Group Tasks
router.get('/student/tasks', authorize('student'), LmsController.getStudentTasks);
router.post('/tasks/:taskId/submit', authorize('student'), LmsController.submitGroupTask);

export default router;
