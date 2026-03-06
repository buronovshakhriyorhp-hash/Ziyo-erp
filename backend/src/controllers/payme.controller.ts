import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { pool } from '../config/database';
import { sendSuccess, AppError } from '../utils/api-response.util';
import { logger } from '../utils/logger.util';
import { PaymentService } from '../services/payment.service';
import { PaymentRepository } from '../repositories/payment.repository';

const paymentSvc = new PaymentService(new PaymentRepository());

// ============================================================
// PAYME INTEGRATION (Payme Business API)
// Docs: https://developer.payme.uz/
// ============================================================

const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID ?? '';
const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY ?? '';
const IS_TEST = process.env.NODE_ENV !== 'production';

// Payme metod nomlari
const METHODS = {
    CHECK_PERFORM: 'CheckPerformTransaction',
    CREATE: 'CreateTransaction',
    PERFORM: 'PerformTransaction',
    CANCEL: 'CancelTransaction',
    CHECK_STATUS: 'CheckTransaction',
    GET_STATEMENT: 'GetStatement',
} as const;

// Xato kodlari
const PAYME_ERRORS = {
    METHOD_NOT_FOUND: { code: -32601, message: { ru: 'Метод не найден', uz: 'Metod topilmadi', en: 'Method not found' } },
    INVALID_AMOUNT: { code: -31001, message: { ru: 'Неверная сумма', uz: 'Noto\'g\'ri summa', en: 'Invalid amount' } },
    ORDER_NOT_FOUND: { code: -31050, message: { ru: 'Заказ не найден', uz: 'Buyurtma topilmadi', en: 'Order not found' } },
    ORDER_CANCELLED: { code: -31007, message: { ru: 'Заказ отменён', uz: 'Buyurtma bekor qilindi', en: 'Order cancelled' } },
    TRANSACTION_NOT_ALLOWED: { code: -31008, message: { ru: 'Транзакция запрещена', uz: 'Tranzaksiya taqiqlangan', en: 'Transaction not allowed' } },
    TRANSACTION_NOT_FOUND: { code: -31003, message: { ru: 'Транзакция не найдена', uz: 'Tranzaksiya topilmadi', en: 'Transaction not found' } },
    CANT_PERFORM: { code: -31008, message: { ru: 'Невозможно выполнить операцию', uz: 'Operatsiyani bajarish mumkin emas', en: 'Cannot perform operation' } },
} as const;

export class PaymeController {
    /** Autentifikatsiya tekshiruvi */
    private verifyAuth(req: Request): boolean {
        const authHeader = req.headers.authorization ?? '';
        if (!authHeader.startsWith('Basic ')) return false;

        const base64 = authHeader.slice(6);
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        const [login, password] = decoded.split(':');

        const expectedLogin = IS_TEST ? 'Paycom' : PAYME_MERCHANT_ID;
        return login === expectedLogin && password === PAYME_SECRET_KEY;
    }

    /** Asosiy Payme webhook handler */
    handle = async (req: Request, res: Response): Promise<void> => {
        if (!this.verifyAuth(req)) {
            res.status(401).json({
                error: { code: -32504, message: { ru: 'Недостаточно привилегий', uz: 'Yetarli imtiyozlar yo\'q' } },
                id: req.body?.id ?? null
            });
            return;
        }

        const { method, params, id } = req.body ?? {};

        logger.debug(`Payme request: ${method}`);

        try {
            switch (method) {
                case METHODS.CHECK_PERFORM:
                    await this.checkPerform(params, id, res);
                    break;
                case METHODS.CREATE:
                    await this.createTransaction(params, id, res);
                    break;
                case METHODS.PERFORM:
                    await this.performTransaction(params, id, res);
                    break;
                case METHODS.CANCEL:
                    await this.cancelTransaction(params, id, res);
                    break;
                case METHODS.CHECK_STATUS:
                    await this.checkStatus(params, id, res);
                    break;
                default:
                    res.json({ error: PAYME_ERRORS.METHOD_NOT_FOUND, id });
            }
        } catch (err) {
            logger.error('Payme handler xatosi:', err);
            res.json({ error: PAYME_ERRORS.CANT_PERFORM, id });
        }
    };

    /** Tranzaksiya bajarilishi mumkinligini tekshirish */
    private async checkPerform(params: any, id: string, res: Response): Promise<void> {
        const { account, amount } = params ?? {};
        const enrollmentId = account?.enrollment_id;

        if (!enrollmentId) {
            res.json({ error: PAYME_ERRORS.ORDER_NOT_FOUND, id });
            return;
        }

        const enrollment = await pool.query(
            `SELECT e.id, e.status, pd.amount_due, pd.amount_paid
             FROM enrollments e
             LEFT JOIN payment_debts pd ON pd.enrollment_id = e.id AND pd.status != 'paid'
             WHERE e.id = $1`,
            [enrollmentId]
        );

        if (!enrollment.rows.length) {
            res.json({ error: PAYME_ERRORS.ORDER_NOT_FOUND, id });
            return;
        }

        const enr = enrollment.rows[0];

        if (enr.status !== 'active') {
            res.json({ error: PAYME_ERRORS.ORDER_CANCELLED, id });
            return;
        }

        // Minimal summa: 1000 so'm (tiyin = 100), max: 100_000_000 tiyin
        const amountTiyin = parseInt(amount);
        if (amountTiyin < 100_000 || amountTiyin > 100_000_000_000) {
            res.json({ error: PAYME_ERRORS.INVALID_AMOUNT, id });
            return;
        }

        res.json({
            result: {
                allow: true,
                detail: {
                    receipt_type: 0
                }
            },
            id
        });
    }

    /** Tranzaksiya yaratish */
    private async createTransaction(params: any, id: string, res: Response): Promise<void> {
        const { id: paymeId, time, amount, account } = params ?? {};
        const enrollmentId = account?.enrollment_id;

        // Mavjud tranzaktsiyani tekshir
        const existing = await pool.query(
            `SELECT * FROM payme_transactions WHERE payme_id = $1`,
            [paymeId]
        );

        if (existing.rows.length) {
            const tx = existing.rows[0];
            if (tx.state !== 1) {
                res.json({ error: PAYME_ERRORS.CANT_PERFORM, id });
                return;
            }
            res.json({
                result: {
                    create_time: tx.create_time,
                    transaction: tx.id.toString(),
                    state: 1
                },
                id
            });
            return;
        }

        const createTime = Date.now();
        const result = await pool.query(
            `INSERT INTO payme_transactions 
             (payme_id, enrollment_id, amount_tiyin, state, create_time)
             VALUES ($1, $2, $3, 1, $4) RETURNING id`,
            [paymeId, enrollmentId, parseInt(amount), createTime]
        );

        res.json({
            result: {
                create_time: createTime,
                transaction: result.rows[0].id.toString(),
                state: 1
            },
            id
        });
    }

    /** Tranzaksiyani bajarish — asosiy to'lov */
    private async performTransaction(params: any, id: string, res: Response): Promise<void> {
        const { id: paymeId } = params ?? {};

        const txResult = await pool.query(
            `SELECT * FROM payme_transactions WHERE payme_id = $1`,
            [paymeId]
        );

        if (!txResult.rows.length) {
            res.json({ error: PAYME_ERRORS.TRANSACTION_NOT_FOUND, id });
            return;
        }

        const tx = txResult.rows[0];

        if (tx.state === 2) {
            // Allaqachon bajarilgan
            res.json({
                result: { transaction: tx.id.toString(), perform_time: tx.perform_time, state: 2 },
                id
            });
            return;
        }

        const performTime = Date.now();

        await pool.query('BEGIN');
        try {
            await pool.query(
                `UPDATE payme_transactions SET state = 2, perform_time = $1 WHERE payme_id = $2`,
                [performTime, paymeId]
            );

            // Enrollment / Student IDs
            const enrResult = await pool.query(`SELECT id, student_id FROM enrollments WHERE id = $1`, [tx.enrollment_id]);
            const enrollment = enrResult.rows[0];

            let paymentMethodResult = await pool.query(`SELECT id FROM payment_methods WHERE name = 'Online'`);
            if (paymentMethodResult.rows.length === 0) {
                // Fallback if not found
                paymentMethodResult = await pool.query(`SELECT id FROM payment_methods LIMIT 1`);
            }

            // Atomik PaymentService ga o'tkazildi
            const today = new Date();
            const yearStr = today.getFullYear();
            const monthStr = ('0' + (today.getMonth() + 1)).slice(-2);
            const paymentMonth = `${yearStr}-${monthStr}-01`;

            await paymentSvc.makePayment({
                enrollmentId: tx.enrollment_id,
                studentId: enrollment.student_id,
                paymentMethodId: paymentMethodResult.rows[0].id,
                receivedBy: 1, // System admin/bot ID
                amount: tx.amount_tiyin / 100,
                paymentMonth,
                paymentDate: today.toISOString().split('T')[0],
                description: 'Payme orqali online to\'lov',
                receiptNumber: paymeId,
                reqContext: {
                    managerId: 1,
                    managerName: 'Payme System',
                    ip: 'payme-webhook-ip',
                    ua: 'payme-bot',
                }
            });

            await pool.query('COMMIT');
        } catch (err) {
            await pool.query('ROLLBACK');
            logger.error('Payme perform xatosi:', err);
            res.json({ error: PAYME_ERRORS.CANT_PERFORM, id });
            return;
        }

        res.json({
            result: {
                transaction: tx.id.toString(),
                perform_time: performTime,
                state: 2
            },
            id
        });
    }

    /** Tranzaksiyani bekor qilish */
    private async cancelTransaction(params: any, id: string, res: Response): Promise<void> {
        const { id: paymeId, reason } = params ?? {};

        const txResult = await pool.query(
            `SELECT * FROM payme_transactions WHERE payme_id = $1`,
            [paymeId]
        );

        if (!txResult.rows.length) {
            res.json({ error: PAYME_ERRORS.TRANSACTION_NOT_FOUND, id });
            return;
        }

        const tx = txResult.rows[0];
        const cancelTime = Date.now();
        const newState = tx.state === 2 ? -2 : -1;

        await pool.query(
            `UPDATE payme_transactions SET state = $1, cancel_time = $2, reason = $3 WHERE payme_id = $4`,
            [newState, cancelTime, reason, paymeId]
        );

        if (tx.state === 2) {
            // Agar tranzaksiya allaqachon bajarilgan bo'lsa (state=2), demak uni orqaga qaytarish kerak.
            // Payments jadvalidan receipt_number bo'yicha to'lovni topib uni cancel qilish kerak.
            const pResult = await pool.query(`SELECT id FROM payments WHERE receipt_number = $1`, [paymeId]);
            if (pResult.rows.length > 0) {
                await paymentSvc.cancelPayment(pResult.rows[0].id);
            }
        }

        res.json({
            result: {
                transaction: tx.id.toString(),
                cancel_time: cancelTime,
                state: newState
            },
            id
        });
    }

    /** Tranzaksiya holatini tekshirish */
    private async checkStatus(params: any, id: string, res: Response): Promise<void> {
        const { id: paymeId } = params ?? {};

        const txResult = await pool.query(
            `SELECT * FROM payme_transactions WHERE payme_id = $1`,
            [paymeId]
        );

        if (!txResult.rows.length) {
            res.json({ error: PAYME_ERRORS.TRANSACTION_NOT_FOUND, id });
            return;
        }

        const tx = txResult.rows[0];
        res.json({
            result: {
                create_time: tx.create_time,
                perform_time: tx.perform_time ?? 0,
                cancel_time: tx.cancel_time ?? 0,
                transaction: tx.id.toString(),
                state: tx.state,
                reason: tx.reason ?? null
            },
            id
        });
    }
}

export const paymeController = new PaymeController();
