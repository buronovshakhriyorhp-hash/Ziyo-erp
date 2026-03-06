import { Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { GroupStatus } from '../repositories/group.repository';
import { sendSuccess } from '../utils/api-response.util';

export class GroupController {
    constructor(private readonly groupSvc: GroupService) { }

    // GET /api/academic/groups?courseId=&teacherId=&status=&search=&page=&limit=
    list = async (req: Request, res: Response): Promise<void> => {
        const result = await this.groupSvc.list({
            courseId: req.query.courseId ? parseInt(req.query.courseId as string) : undefined,
            teacherId: req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined,
            status: req.query.status ? (req.query.status as GroupStatus) : undefined,
            search: req.query.search as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Guruhlar ro\'yxati');
    };

    // GET /api/academic/groups/:id
    getOne = async (req: Request, res: Response): Promise<void> => {
        const group = await this.groupSvc.getById(parseInt(req.params.id));
        sendSuccess(res, group, 'Guruh ma\'lumotlari');
    };

    // POST /api/academic/groups
    // Body: { courseId, teacherId, roomId, dayComboId, name, startTime, endTime, startDate, maxStudents }
    create = async (req: Request, res: Response): Promise<void> => {
        const group = await this.groupSvc.create(req.body);
        sendSuccess(res, group, 'Yangi guruh muvaffaqiyatli yaratildi', 201);
    };

    // PATCH /api/academic/groups/:id
    update = async (req: Request, res: Response): Promise<void> => {
        const group = await this.groupSvc.update(parseInt(req.params.id), req.body);
        sendSuccess(res, group, 'Guruh ma\'lumotlari yangilandi');
    };

    // PATCH /api/academic/groups/:id/status
    // Body: { status: 'recruiting'|'active'|'completed'|'cancelled' }
    changeStatus = async (req: Request, res: Response): Promise<void> => {
        const { status } = req.body;
        const group = await this.groupSvc.changeStatus(parseInt(req.params.id), status);
        sendSuccess(res, group, `Guruh holati "${status}" ga o'zgartirildi`);
    };

    // DELETE /api/academic/groups/:id
    delete = async (req: Request, res: Response): Promise<void> => {
        await this.groupSvc.delete(parseInt(req.params.id));
        sendSuccess(res, null, 'Guruh o\'chirildi');
    };
}
