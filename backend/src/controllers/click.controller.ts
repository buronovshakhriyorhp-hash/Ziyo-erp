import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { pool } from '../config/database';
import { sendSuccess } from '../utils/api-response.util';
import { logger } from '../utils/logger.util';
import { PaymentService } from '../services/payment.service';
import { PaymentRepository } from '../repositories/payment.repository';

const paymentSvc = new PaymentService(new PaymentRepository());

// ============================================================
// CLICK INTEGRATION (Click Merchant API)
// Docs: https://docs.click.uz/
// ============================================================

const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID ?? '';
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY ?? '';
const CLICK_MERCHANT_USER_ID = process.env.CLICK_MERCHANT_USER_ID ?? '';

/** Click so'rov imzosini tekshirish */
function verifyClickSignature(params: {
    clickTransId: string;
    serviceId: string;
    merchantTransId: string;
    amount: string;
    action: string;
    signTime: string;
    signString: string;
}): boolean {
    const rawSign = [
        params.clickTransId,
        params.serviceId,
        CLICK_SECRET_KEY,
        params.merchantTransId,
        params.amount,
        params.action,
        params.signTime,
    ].join('');

    const expectedSign = crypto.createHash('md5').update(rawSign).digest('hex');
    return expectedSign === params.signString;
}

export class ClickController {
    /**
     * PREPARE — Click talabani tekshirish
     * Click first calls prepare to verify the order exists and is valid
     */
    prepare = async (req: Request, res: Response): Promise<void> => {
        const {
            click_trans_id,
            service_id,
            merchant_trans_id,   // bu bizning enrollment_id
            amount,
            action,
            sign_time,
            sign_string,
        } = req.body;

        const isValid = verifyClickSignature({
            clickTransId: click_trans_id,
            serviceId: service_id,
            merchantTransId: merchant_trans_id,
            amount,
            action,
            signTime: sign_time,
            signString: sign_string,
        });

        if (!isValid) {
            res.json({ error: -1, error_note: 'SIGN CHECK FAILED!' });
            return;
        }

        const check = await pool.query(
            `SELECT e.id, e.status, s.full_name as student_name
             FROM enrollments e
             JOIN students s ON s.id = e.student_id
             WHERE e.id = $1`,
            [merchant_trans_id]
        );

        if (!check.rows.length) {
            res.json({ error: -5, error_note: 'User does not exist' });
            return;
        }

        const enr = check.rows[0];
        if (enr.status !== 'active') {
            res.json({ error: -9, error_note: 'Transaction is denied' });
            return;
        }

        const amountNum = parseFloat(amount);
        if (amountNum < 1000 || amountNum > 100_000_000) {
            res.json({ error: -2, error_note: 'Incorrect parameter amount' });
            return;
        }

        // Click tranzaksiyasini saqlash
        await pool.query(
            `INSERT INTO click_transactions 
             (click_trans_id, enrollment_id, amount, state)
             VALUES ($1, $2, $3, 'pending')
             ON CONFLICT (click_trans_id) DO NOTHING`,
            [click_trans_id, merchant_trans_id, amountNum]
        );

        logger.debug(`Click PREPARE OK: enrollment=${merchant_trans_id}, amount=${amount}`);

        res.json({
            click_trans_id,
            merchant_trans_id,
            merchant_prepare_id: click_trans_id, // Prepare ID sifatida ishlatiladi
            error: 0,
            error_note: 'Success'
        });
    };

    /**
     * COMPLETE — To'lovni yakunlash
     */
    complete = async (req: Request, res: Response): Promise<void> => {
        const {
            click_trans_id,
            service_id,
            merchant_trans_id,
            merchant_prepare_id,
            amount,
            action,
            sign_time,
            sign_string,
            error,
            error_note,
        } = req.body;

        const isValid = verifyClickSignature({
            clickTransId: click_trans_id,
            serviceId: service_id,
            merchantTransId: merchant_trans_id,
            amount,
            action,
            signTime: sign_time,
            signString: sign_string,
        });

        if (!isValid) {
            res.json({ error: -1, error_note: 'SIGN CHECK FAILED!' });
            return;
        }

        // To'lov bekor qilingan
        if (parseInt(error) < 0) {
            await pool.query(
                `UPDATE click_transactions SET state = 'cancelled' WHERE click_trans_id = $1`,
                [click_trans_id]
            );
            res.json({ click_trans_id, merchant_trans_id, error: 0, error_note: 'Success' });
            return;
        }

        const txResult = await pool.query(
            `SELECT * FROM click_transactions WHERE click_trans_id = $1`,
            [click_trans_id]
        );

        if (!txResult.rows.length) {
            res.json({ error: -6, error_note: 'Transaction does not exist' });
            return;
        }

        const tx = txResult.rows[0];
        if (tx.state === 'completed') {
            // Idempotency: allaqachon bajarilgan
            res.json({ click_trans_id, merchant_trans_id, error: 0, error_note: 'Success' });
            return;
        }

        await pool.query('BEGIN');
        try {
            await pool.query(
                `UPDATE click_transactions SET state = 'completed' WHERE click_trans_id = $1`,
                [click_trans_id]
            );

            // Enrollment / Student IDs
            const enrResult = await pool.query(`SELECT id, student_id FROM enrollments WHERE id = $1`, [tx.enrollment_id]);
            const enrollment = enrResult.rows[0];

            let paymentMethodResult = await pool.query(`SELECT id FROM payment_methods WHERE name = 'Online'`);
            if (paymentMethodResult.rows.length === 0) {
                // Fallback if not found
                paymentMethodResult = await pool.query(`SELECT id FROM payment_methods LIMIT 1`);
            }

            // ERP payments jadvaliga markazlashtirilgan service orqali yozish (Atomicity va qarzni yangilash)
            const today = new Date();
            const yearStr = today.getFullYear();
            const monthStr = ('0' + (today.getMonth() + 1)).slice(-2);
            const paymentMonth = `${yearStr}-${monthStr}-01`;

            await paymentSvc.makePayment({
                enrollmentId: tx.enrollment_id,
                studentId: enrollment.student_id,
                paymentMethodId: paymentMethodResult.rows[0].id,
                receivedBy: 1, // System admin/bot ID
                amount: tx.amount,
                paymentMonth,
                paymentDate: today.toISOString().split('T')[0],
                description: 'Click orqali online to\'lov',
                receiptNumber: click_trans_id,
                reqContext: {
                    managerId: 1,
                    managerName: 'Click System',
                    ip: req.ip || req.connection.remoteAddress || 'unknown',
                    ua: req.headers['user-agent'] || 'click-bot',
                }
            });

            await pool.query('COMMIT');
            logger.info(`Click to'lov yakunlandi: enrollment=${tx.enrollment_id}, summa=${tx.amount}`);
        } catch (err) {
            await pool.query('ROLLBACK');
            logger.error('Click complete xatosi:', err);
            res.json({ error: -9, error_note: 'Transaction is denied' });
            return;
        }

        res.json({
            click_trans_id,
            merchant_trans_id,
            error: 0,
            error_note: 'Success'
        });
    };
}

export const clickController = new ClickController();
