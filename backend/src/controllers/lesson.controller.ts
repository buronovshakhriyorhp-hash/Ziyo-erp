import { Request, Response } from 'express';
import { LessonService } from '../services/lesson.service';
import { sendSuccess, AppError } from '../utils/api-response.util';

export class LessonController {
    constructor(private readonly lessonSvc: LessonService) { }

    // GET /api/academic/lessons?groupId=&roomId=&date=&fromDate=&toDate=&status=&page=
    list = async (req: Request, res: Response): Promise<void> => {
        const result = await this.lessonSvc.list({
            groupId: req.query.groupId ? parseInt(req.query.groupId as string) : undefined,
            roomId: req.query.roomId ? parseInt(req.query.roomId as string) : undefined,
            teacherId: req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined,
            date: req.query.date as string | undefined,
            fromDate: req.query.fromDate as string | undefined,
            toDate: req.query.toDate as string | undefined,
            status: req.query.status as any,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 30,
        });
        sendSuccess(res, result, 'Darslar jadvali');
    };

    // GET /api/academic/lessons/today?teacherId=
    today = async (req: Request, res: Response): Promise<void> => {
        const teacherId = req.query.teacherId
            ? parseInt(req.query.teacherId as string)
            : undefined;
        const data = await this.lessonSvc.getTodaySchedule(teacherId);
        sendSuccess(res, data, 'Bugungi jadval');
    };

    // GET /api/academic/lessons/:id
    getOne = async (req: Request, res: Response): Promise<void> => {
        const lesson = await this.lessonSvc.getById(parseInt(req.params.id));
        sendSuccess(res, lesson, 'Dars ma\'lumotlari');
    };

    /**
     * GET /api/academic/lessons/room-check
     * ?roomId=&lessonDate=&startTime=&endTime=&excludeLessonId=
     *
     * Xona bandligi tekshiruvi (dars yaratishdan oldin frontend da chaqiriladi)
     */
    checkRoom = async (req: Request, res: Response): Promise<void> => {
        const { roomId, lessonDate, startTime, endTime, excludeLessonId } = req.query;
        if (!roomId || !lessonDate || !startTime || !endTime) {
            throw new AppError(
                'roomId, lessonDate, startTime va endTime majburiy',
                400, 'MISSING_PARAMS'
            );
        }
        const result = await this.lessonSvc.checkRoomAvailability({
            roomId: parseInt(roomId as string),
            lessonDate: lessonDate as string,
            startTime: startTime as string,
            endTime: endTime as string,
            excludeLessonId: excludeLessonId ? parseInt(excludeLessonId as string) : undefined,
        });
        sendSuccess(res, result, result.available ? 'Xona bo\'sh' : 'Xona band!');
    };

    /**
     * POST /api/academic/lessons
     * Body: { groupId, teacherId, roomId?, lessonDate, startTime, endTime, topic?, homework? }
     *
     * ⚠️ Conflict Detection:
     *   → Xona bitta vaqtda ikki guruh orasida bo'lmasin
     *   → O'qituvchi bitta vaqtda ikki darsda bo'lmasin
     */
    create = async (req: Request, res: Response): Promise<void> => {
        const lesson = await this.lessonSvc.create({
            ...req.body,
            groupId: parseInt(req.body.groupId),
            teacherId: parseInt(req.body.teacherId),
            roomId: req.body.roomId ? parseInt(req.body.roomId) : null,
        });
        sendSuccess(res, lesson, 'Dars qo\'shildi', 201);
    };

    // PATCH /api/academic/lessons/:id
    update = async (req: Request, res: Response): Promise<void> => {
        const lesson = await this.lessonSvc.update(parseInt(req.params.id), {
            ...req.body,
            roomId: req.body.roomId ? parseInt(req.body.roomId) : undefined,
            teacherId: req.body.teacherId ? parseInt(req.body.teacherId) : undefined,
        });
        sendSuccess(res, lesson, 'Dars yangilandi');
    };

    // PATCH /api/academic/lessons/:id/cancel
    cancel = async (req: Request, res: Response): Promise<void> => {
        const lesson = await this.lessonSvc.cancel(
            parseInt(req.params.id),
            req.body.reason ?? ''
        );
        sendSuccess(res, lesson, 'Dars bekor qilindi');
    };

    // DELETE /api/academic/lessons/:id
    delete = async (req: Request, res: Response): Promise<void> => {
        await this.lessonSvc.delete(parseInt(req.params.id));
        sendSuccess(res, null, 'Dars o\'chirildi');
    };
}
