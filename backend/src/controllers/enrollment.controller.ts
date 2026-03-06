import { Request, Response } from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import { EnrollmentStatus } from '../repositories/enrollment.repository';
import { sendSuccess, AppError } from '../utils/api-response.util';

export class EnrollmentController {
    constructor(private readonly enrollSvc: EnrollmentService) { }

    // GET /api/academic/groups/:groupId/enrollments
    listByGroup = async (req: Request, res: Response): Promise<void> => {
        const result = await this.enrollSvc.getGroupEnrollments(
            parseInt(req.params.groupId)
        );
        sendSuccess(res, result, 'Guruh talabalari ro\'yxati');
    };

    // GET /api/academic/enrollments/student/:studentId
    listByStudent = async (req: Request, res: Response): Promise<void> => {
        const result = await this.enrollSvc.getStudentEnrollments(
            parseInt(req.params.studentId)
        );
        sendSuccess(res, result, 'Talaba guruh tarixi');
    };

    /**
     * POST /api/academic/enrollments
     * Body: { groupId, studentId, discountPct?, notes?, skipBalanceCheck? }
     *
     * 3 ta biznes qoidasi avtomatik tekshiriladi:
     *   1. Guruh sig'imi (capacity)
     *   2. Talaba allaqachon bu guruhda yoki yo'qligi (duplicate)
     *   3. Talaba balansi (ixtiyoriy — skipBalanceCheck=true bilan o'tkazib yuborish mumkin)
     */
    enroll = async (req: Request, res: Response): Promise<void> => {
        const { groupId, studentId, discountPct, notes, skipBalanceCheck } = req.body;

        if (!groupId || !studentId) {
            throw new AppError('groupId va studentId talab qilinadi', 400, 'MISSING_FIELDS');
        }

        const result = await this.enrollSvc.enrollStudent({
            groupId: parseInt(groupId),
            studentId: parseInt(studentId),
            discountPct: discountPct ? parseFloat(discountPct) : 0,
            notes: notes ?? null,
            skipBalanceCheck: skipBalanceCheck === true || skipBalanceCheck === 'true',
        });

        sendSuccess(res, result, 'Talaba guruhga muvaffaqiyatli yozildi', 201);
    };

    // PATCH /api/academic/enrollments/:id/status
    // Body: { status, leftAt? }
    changeStatus = async (req: Request, res: Response): Promise<void> => {
        const { status, leftAt } = req.body;
        const result = await this.enrollSvc.changeStatus(
            parseInt(req.params.id),
            status as EnrollmentStatus,
            leftAt
        );
        sendSuccess(res, result, `Yozilish holati "${status}" ga o'zgartirildi`);
    };

    // DELETE /api/academic/enrollments/:id
    remove = async (req: Request, res: Response): Promise<void> => {
        await this.enrollSvc.removeStudent(parseInt(req.params.id));
        sendSuccess(res, null, 'Talaba guruhdan chiqarildi');
    };
}
