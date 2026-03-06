import { Request, Response } from 'express';
import { LmsService } from '../services/lms.service';
import { sendSuccess, sendError } from '../utils/api-response.util';

export class LmsController {
    static async getGamificationProfile(req: Request, res: Response) {
        try {
            const studentId = parseInt((req.user as any).userId);
            const profile = await LmsService.getGamificationProfile(studentId);
            return sendSuccess(res, profile);
        } catch (error) {
            return sendError(res, 'Profil xatosi', 500, 'PROFILE_ERROR', error);
        }
    }

    static async getLeaderboard(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const leaders = await LmsService.getLeaderboard(limit);
            return sendSuccess(res, leaders);
        } catch (error) {
            return sendError(res, "Reytingni olib bo'lmadi", 500, 'LEADERBOARD_ERROR', error);
        }
    }

    static async getCourseMaterials(req: Request, res: Response) {
        try {
            const courseId = parseInt(req.params.courseId);
            const studentId = parseInt((req.user as any).userId);
            const materials = await LmsService.getCourseMaterials(courseId, studentId);
            return sendSuccess(res, materials);
        } catch (error: any) {
            if (error.message === 'NOT_ENROLLED') {
                return res.status(403).json({ success: false, message: "Sizga bu kurs ochiq emas" });
            }
            return sendError(res, "Materiallarni yuklab bo'lmadi", 500, 'MATERIALS_ERROR', error);
        }
    }

    static async submitAssignment(req: Request, res: Response) {
        try {
            const materialId = parseInt(req.params.materialId);
            const studentId = parseInt((req.user as any).userId);
            const { contentUrl } = req.body;

            if (!contentUrl) {
                return res.status(400).json({ success: false, message: 'Fayl yoki link majburiy' });
            }

            // Start AI evaluation async
            const initialSubmission = await LmsService.submitAssignment(materialId, studentId, contentUrl);

            return sendSuccess(res, initialSubmission, "ZiyoBot vazifani tekshirishni boshladi. Bir oz kuting...");
        } catch (error) {
            return sendError(res, "Vazifani yuklashda xato", 500, 'SUBMISSION_ERROR', error);
        }
    }

    // Homework & Extra Gamified Tasks (Phase 6)
    static async getGroupTasks(req: Request, res: Response) {
        try {
            const groupId = parseInt(req.params.groupId);
            const tasks = await LmsService.getGroupTasks(groupId);
            return sendSuccess(res, tasks);
        } catch (error) {
            return sendError(res, "Vazifalarni yuklab bo'lmadi", 500, 'TASKS_ERROR', error);
        }
    }

    static async createGroupTask(req: Request, res: Response) {
        try {
            const teacherId = parseInt((req.user as any).userId);
            const data = { ...req.body, teacherId };
            const task = await LmsService.createGroupTask(data);
            return sendSuccess(res, task, "Vazifa muvaffaqiyatli yaratildi");
        } catch (error) {
            return sendError(res, "Vazifa yaratishda xato", 500, 'CREATE_TASK_ERROR', error);
        }
    }

    static async getStudentTasks(req: Request, res: Response) {
        try {
            const studentId = parseInt((req.user as any).userId);
            const tasks = await LmsService.getStudentTasks(studentId);
            return sendSuccess(res, tasks);
        } catch (error) {
            return sendError(res, "Vazifalar ro'yxatini yuklab bo'lmadi", 500, 'STUDENT_TASKS_ERROR', error);
        }
    }

    static async submitGroupTask(req: Request, res: Response) {
        try {
            const taskId = parseInt(req.params.taskId);
            const studentId = parseInt((req.user as any).userId);
            const { contentUrl } = req.body;
            if (!contentUrl) {
                return res.status(400).json({ success: false, message: 'Fayl yoki link majburiy' });
            }
            const submission = await LmsService.submitGroupTask(taskId, studentId, contentUrl);
            return sendSuccess(res, submission, "Vazifa yuborildi");
        } catch (error) {
            return sendError(res, "Vazifani yuborishda xato", 500, 'SUBMIT_TASK_ERROR', error);
        }
    }

    static async gradeTask(req: Request, res: Response) {
        try {
            const submissionId = parseInt(req.params.submissionId);
            const { points, feedback } = req.body;
            await LmsService.gradeTask(submissionId, points, feedback);
            return sendSuccess(res, null, "Vazifa baholandi");
        } catch (error) {
            return sendError(res, "Baholashda xato", 500, 'GRADE_TASK_ERROR', error);
        }
    }
}
