import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/api-response.util';

export class AttendanceController {
    constructor(private readonly attSvc: AttendanceService) { }

    // GET /api/attendance/lesson/:lessonId
    getByLesson = async (req: Request, res: Response): Promise<void> => {
        const data = await this.attSvc.getByLesson(parseInt(req.params.lessonId));
        sendSuccess(res, data, 'Dars davomati');
    };

    // GET /api/attendance/student/:studentId?from=&to=&page=&limit=
    getByStudent = async (req: Request, res: Response): Promise<void> => {
        const result = await this.attSvc.getByStudent(
            parseInt(req.params.studentId), {
            from: req.query.from as string | undefined,
            to: req.query.to as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 30,
        }
        );
        sendSuccess(res, result, 'Talaba davomati');
    };

    // GET /api/attendance/debtors?minDebt=&page=&limit=
    getDebtors = async (req: Request, res: Response): Promise<void> => {
        const result = await this.attSvc.getDebtors({
            minDebt: req.query.minDebt ? parseFloat(req.query.minDebt as string) : 0,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Qarzdor talabalar');
    };

    /**
     * POST /api/attendance/mark
     *
     * Body:
     * {
     *   lessonId: number,
     *   teacherStatus: 'present'|'absent'|'late'|'substitute',
     *   teacherLateMinutes?: number,
     *   substituteTeacherId?: number,
     *   students: [
     *     { studentId, status: 'present'|'absent'|'late'|'excused',
     *       lateMinutes?, notes? }
     *   ]
     * }
     *
     * ⚡ ATOMIC TRANSACTION:
     *   → Davomat yoziladi
     *   → Dars 'completed' ga o'tkaziladi
     *   → present/late → dars haqqi payment_debts ga qo'shiladi
     *   → Qarz muddati o'tgan bo'lsa → status='overdue'
     */
    mark = async (req: Request, res: Response): Promise<void> => {
        const user = req.user as any;
        const markedBy = user.sub;
        const {
            lessonId, students, teacherStatus,
            teacherLateMinutes, substituteTeacherId,
            applyBilling,
        } = req.body;

        const reqContext = {
            managerId: markedBy,
            managerName: `${user.firstName} ${user.lastName}`,
            ip: req.ip as string,
            ua: (req.headers['user-agent'] as string) || 'N/A',
        };

        const result = await this.attSvc.markAttendance({
            lessonId: parseInt(lessonId),
            markedBy,
            students,
            teacherStatus: teacherStatus ?? 'present',
            teacherLateMinutes: teacherLateMinutes ?? 0,
            substituteTeacherId: substituteTeacherId ?? null,
            applyBilling: applyBilling !== false,
            reqContext,
        });

        sendSuccess(res, result, 'Davomat muvaffaqiyatli belgilandi', 201);
    };
}
