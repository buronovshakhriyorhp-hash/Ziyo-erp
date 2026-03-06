import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { sendSuccess, AppError } from '../utils/api-response.util';

export class TaskController {
    constructor(private readonly taskSvc: TaskService) { }

    // GET /api/crm/tasks?assignedTo=&leadId=&isCompleted=&overdueOnly=&search=&page=&limit=
    list = async (req: Request, res: Response): Promise<void> => {
        const result = await this.taskSvc.list({
            assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined,
            leadId: req.query.leadId ? parseInt(req.query.leadId as string) : undefined,
            isCompleted: req.query.isCompleted !== undefined
                ? req.query.isCompleted === 'true' : undefined,
            overdueOnly: req.query.overdueOnly === 'true',
            search: req.query.search as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Vazifalar ro\'yxati');
    };

    // GET /api/crm/tasks/overdue-summary  — Dashboard uchun hissiy xulosa
    overdueSum = async (_req: Request, res: Response): Promise<void> => {
        const data = await this.taskSvc.getOverdueSummary();
        sendSuccess(res, data, 'Muddati o\'tgan vazifalar xulosasi');
    };

    // GET /api/crm/tasks/:id
    getOne = async (req: Request, res: Response): Promise<void> => {
        const task = await this.taskSvc.getById(parseInt(req.params.id));
        sendSuccess(res, task, 'Vazifa ma\'lumoti');
    };

    // POST /api/crm/tasks
    // Body: { leadId?, title, description?, dueDate? }
    // assignedTo — JWT dan olinadi yoki body dan berilishi mumkin (Admin uchun)
    create = async (req: Request, res: Response): Promise<void> => {
        const currentUserId = req.user!.sub;
        const assignedTo = req.body.assignedTo
            ? parseInt(req.body.assignedTo) : currentUserId;

        if (!req.body.title) {
            throw new AppError('title maydoni majburiy', 400, 'MISSING_TITLE');
        }

        const task = await this.taskSvc.create({
            leadId: req.body.leadId ? parseInt(req.body.leadId) : null,
            assignedTo,
            title: req.body.title,
            description: req.body.description ?? null,
            dueDate: req.body.dueDate ?? null,
        });
        sendSuccess(res, task, 'Vazifa yaratildi', 201);
    };

    // PATCH /api/crm/tasks/:id
    update = async (req: Request, res: Response): Promise<void> => {
        const task = await this.taskSvc.update(parseInt(req.params.id), {
            leadId: req.body.leadId !== undefined ? parseInt(req.body.leadId) : undefined,
            assignedTo: req.body.assignedTo ? parseInt(req.body.assignedTo) : undefined,
            title: req.body.title,
            description: req.body.description,
            dueDate: req.body.dueDate,
        });
        sendSuccess(res, task, 'Vazifa yangilandi');
    };

    // PATCH /api/crm/tasks/:id/complete — Bajarildi ✅
    complete = async (req: Request, res: Response): Promise<void> => {
        const task = await this.taskSvc.complete(parseInt(req.params.id));
        sendSuccess(res, task, 'Vazifa bajarildi ✅');
    };

    // PATCH /api/crm/tasks/:id/reopen — Qayta ochish 🔄
    reopen = async (req: Request, res: Response): Promise<void> => {
        const task = await this.taskSvc.reopen(parseInt(req.params.id));
        sendSuccess(res, task, 'Vazifa qayta ochildi');
    };

    // DELETE /api/crm/tasks/:id
    delete = async (req: Request, res: Response): Promise<void> => {
        await this.taskSvc.delete(parseInt(req.params.id));
        sendSuccess(res, null, 'Vazifa o\'chirildi');
    };
}
