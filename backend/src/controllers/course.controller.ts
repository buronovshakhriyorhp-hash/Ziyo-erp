import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { sendSuccess } from '../utils/api-response.util';

export class CourseController {
    constructor(private readonly courseSvc: CourseService) { }

    // GET /api/academic/courses?subjectId=&isActive=&level=&search=&page=&limit=
    list = async (req: Request, res: Response): Promise<void> => {
        const result = await this.courseSvc.list({
            subjectId: req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            level: req.query.level as any,
            search: req.query.search as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Kurslar ro\'yxati');
    };

    // GET /api/academic/courses/subjects   — yangi kurs yaratganda fan tanlash uchun
    listSubjects = async (_req: Request, res: Response): Promise<void> => {
        const subjects = await this.courseSvc.listSubjects();
        sendSuccess(res, subjects, 'Fanlar ro\'yxati');
    };

    // GET /api/academic/courses/:id
    getOne = async (req: Request, res: Response): Promise<void> => {
        const course = await this.courseSvc.getById(parseInt(req.params.id));
        sendSuccess(res, course, 'Kurs ma\'lumotlari');
    };

    // POST /api/academic/courses
    // Body: { subjectId, name, description?, durationMonths?, lessonsPerWeek?,
    //         lessonDurationMin?, pricePerMonth, level? }
    create = async (req: Request, res: Response): Promise<void> => {
        const course = await this.courseSvc.create(req.body);
        sendSuccess(res, course, 'Yangi kurs muvaffaqiyatli yaratildi', 201);
    };

    // PATCH /api/academic/courses/:id      — qisman yangilash
    update = async (req: Request, res: Response): Promise<void> => {
        const course = await this.courseSvc.update(parseInt(req.params.id), req.body);
        sendSuccess(res, course, 'Kurs ma\'lumotlari yangilandi');
    };

    // PATCH /api/academic/courses/:id/toggle-active  — faollik holatini almashish
    toggleActive = async (req: Request, res: Response): Promise<void> => {
        const course = await this.courseSvc.toggleActive(parseInt(req.params.id));
        const msg = course?.isActive ? 'Kurs faollashtirildi' : 'Kurs o\'chirib qo\'yildi';
        sendSuccess(res, course, msg);
    };

    // DELETE /api/academic/courses/:id    — soft delete
    delete = async (req: Request, res: Response): Promise<void> => {
        await this.courseSvc.delete(parseInt(req.params.id));
        sendSuccess(res, null, 'Kurs o\'chirildi');
    };
}
