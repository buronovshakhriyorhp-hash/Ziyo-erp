import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { sendSuccess, AppError } from '../utils/api-response.util';

export class ExpenseController {
    constructor(private readonly expenseSvc: ExpenseService) { }

    // GET /api/finance/expenses?categoryId=&fromDate=&toDate=&page=&limit=
    list = async (req: Request, res: Response): Promise<void> => {
        const result = await this.expenseSvc.list({
            categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
            fromDate: req.query.fromDate as string | undefined,
            toDate: req.query.toDate as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        });
        sendSuccess(res, result, 'Xarajatlar ro\'yxati');
    };

    // GET /api/finance/expenses/categories
    listCategories = async (_req: Request, res: Response): Promise<void> => {
        const cats = await this.expenseSvc.listCategories();
        sendSuccess(res, cats, 'Xarajat toifalari');
    };

    // GET /api/finance/expenses/summary?fromDate=2026-01-01&toDate=2026-03-31
    getSummary = async (req: Request, res: Response): Promise<void> => {
        const { fromDate, toDate } = req.query;
        if (!fromDate || !toDate) {
            throw new AppError('fromDate va toDate talab qilinadi', 400, 'MISSING_DATE_RANGE');
        }
        const result = await this.expenseSvc.getSummary(fromDate as string, toDate as string);
        sendSuccess(res, result, 'Xarajatlar xulosasi');
    };

    // GET /api/finance/expenses/:id
    getOne = async (req: Request, res: Response): Promise<void> => {
        const expense = await this.expenseSvc.getById(parseInt(req.params.id));
        sendSuccess(res, expense, 'Xarajat ma\'lumotlari');
    };

    // POST /api/finance/expenses
    // Body: { categoryId, amount, expenseDate?, paymentMethodId?, description?, receiptUrl? }
    create = async (req: Request, res: Response): Promise<void> => {
        const paidBy = req.user!.sub; // Kim xarajat qildi — JWT dan
        const expense = await this.expenseSvc.create({ ...req.body, paidBy });
        sendSuccess(res, expense, 'Xarajat qayd etildi', 201);
    };

    // PATCH /api/finance/expenses/:id
    update = async (req: Request, res: Response): Promise<void> => {
        const expense = await this.expenseSvc.update(parseInt(req.params.id), req.body);
        sendSuccess(res, expense, 'Xarajat yangilandi');
    };

    // DELETE /api/finance/expenses/:id
    delete = async (req: Request, res: Response): Promise<void> => {
        await this.expenseSvc.delete(parseInt(req.params.id));
        sendSuccess(res, null, 'Xarajat o\'chirildi');
    };
}
