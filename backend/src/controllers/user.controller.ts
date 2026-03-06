import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { sendSuccess } from '../utils/api-response.util';

export class UserController {
    constructor(private readonly userSvc: UserService) { }

    /**
     * GET /api/users
     */
    list = async (req: Request, res: Response) => {
        const { roleId, isActive, search, page, limit } = req.query;

        const result = await this.userSvc.findAll({
            roleId: roleId ? Number(roleId) : undefined,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            search: search as string,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });

        sendSuccess(res, result, 'Foydalanuvchilar ro\'yxati');
    };

    /**
     * GET /api/users/:id
     */
    getById = async (req: Request, res: Response) => {
        const result = await this.userSvc.findById(Number(req.params.id));
        sendSuccess(res, result, 'Foydalanuvchi ma\'lumotlari');
    };

    /**
     * PATCH /api/users/:id
     */
    update = async (req: Request, res: Response) => {
        const result = await this.userSvc.update(Number(req.params.id), req.body);
        sendSuccess(res, result, 'Foydalanuvchi yangilandi');
    };

    /**
     * DELETE /api/users/:id
     */
    deactivate = async (req: Request, res: Response) => {
        await this.userSvc.deactivate(Number(req.params.id));
        sendSuccess(res, null, 'Foydalanuvchi bloklandi');
    };

    /**
     * POST /api/users/:id/activate
     */
    activate = async (req: Request, res: Response) => {
        await this.userSvc.activate(Number(req.params.id));
        sendSuccess(res, null, 'Foydalanuvchi faollashtirildi');
    };
}
