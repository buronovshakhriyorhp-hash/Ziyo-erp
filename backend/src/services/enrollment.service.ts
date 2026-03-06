import {
    EnrollmentRepository,
    CreateEnrollmentData,
    EnrollmentStatus,
} from '../repositories/enrollment.repository';
import { GroupRepository } from '../repositories/group.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { AppError } from '../utils/api-response.util';
import { withTransaction } from '../config/database';

// ============================================================
// ENROLLMENT SERVICE
// Mas'uliyat: Talabani guruhga yozish biznes mantiqi.
//
//  Qoidalar:
//   1. CAPACITY CHECK  — guruhda joy bor-yo'qligini tekshirish
//   2. DUPLICATE CHECK — talaba allaqachon bu guruhda yozilganmi
//   3. BALANCE CHECK   — bitta dars narxiga yetarli mablag'
//                        (PaymentRepository.getStudentBalance orqali)
//   4. Atomik amal     — group_enrollments INSERT + payment_debts INSERT
//                        bitta tranzaksiyada
//
//  ❌ skipBalanceCheck olib tashlandi.
//     Endi:
//      - Admin/manager "discountPct=100" bersa → dars bepul → balance 0 bo'lsa ham kiradi
//      - Aks holda balans yetarli bo'lishi shart
// ============================================================

export interface EnrollStudentDto {
    groupId: number;
    studentId: number;
    discountPct?: number;    // 0–100 orasida chegirma
    notes?: string | null;
    skipBalanceCheck?: boolean;        // Faqat admin/manager: balansni tekshirmaslik
}

export class EnrollmentService {
    constructor(
        private readonly enrollmentRepo: EnrollmentRepository,
        private readonly groupRepo: GroupRepository,
        private readonly paymentRepo?: PaymentRepository,   // Balans tekshiruvi uchun
    ) { }

    // ════════════════════════════════════════════════════════
    // RO'YXAT
    // ════════════════════════════════════════════════════════

    async getGroupEnrollments(groupId: number) {
        const group = await this.groupRepo.findById(groupId);
        if (!group) throw new AppError('Guruh topilmadi', 404, 'GROUP_NOT_FOUND');

        const enrollments = await this.enrollmentRepo.findByGroupId(groupId);
        return {
            group: {
                id: group.id,
                name: group.name,
                maxStudents: group.maxStudents,
                currentStudents: enrollments.length,
                availableSpots: group.maxStudents - enrollments.length,
            },
            enrollments,
        };
    }

    async getStudentEnrollments(studentId: number) {
        return this.enrollmentRepo.findByStudentId(studentId);
    }

    // ════════════════════════════════════════════════════════
    // TALABANI GURUHGA QO'SHISH — 4 QOIDA
    //
    //  Tekshiruv tartibi:
    //   1. Guruh mavjudligi va holati (completed/cancelled bo'lmasligi)
    //   2. Takroriy yozilish oldini olish
    //   3. Sig'im  (capacity)  — guruhda bo'sh joy bormi?
    //   4. Balans  tekshiruvi  — bitta dars narxiga yetarli mablag'
    //      (Eng kam talab: 1 ta dars narxi ≥ balance)
    //      (100% chegirmada balans tekshirilmaydi)
    //   5. Atomik INSERT (group_enrollments + payment_debts)
    // ════════════════════════════════════════════════════════

    async enrollStudent(dto: EnrollStudentDto) {
        const { groupId, studentId, discountPct = 0, notes, skipBalanceCheck = false } = dto;

        // Chegirma diapazoni
        if (discountPct < 0 || discountPct > 100) {
            throw new AppError(
                'Chegirma 0–100% orasida bo\'lishi kerak',
                400, 'INVALID_DISCOUNT'
            );
        }

        // ─ 1. Guruh ────────────────────────────────────────────
        const group = await this.groupRepo.findById(groupId);
        if (!group) {
            throw new AppError('Guruh topilmadi', 404, 'GROUP_NOT_FOUND');
        }
        if (group.status === 'completed' || group.status === 'cancelled') {
            throw new AppError(
                `"${group.status}" holatidagi guruhga yozib bo'lmaydi`,
                400, 'GROUP_NOT_ACCEPTING'
            );
        }

        // ─ 2. Duplicate tekshiruvi ─────────────────────────────
        const alreadyEnrolled = await this.enrollmentRepo.isStudentAlreadyEnrolled(groupId, studentId);
        if (alreadyEnrolled) {
            throw new AppError(
                'Talaba bu guruhda allaqachon yozilgan',
                409, 'STUDENT_ALREADY_ENROLLED'
            );
        }

        // ─ 3. Sig'im tekshiruvi ────────────────────────────────
        const currentCount = await this.enrollmentRepo.countActiveStudents(groupId);
        if (currentCount >= group.maxStudents) {
            throw new AppError(
                `Guruh to'lgan! Hozirgi talabalar: ${currentCount}/${group.maxStudents}`,
                409, 'GROUP_CAPACITY_FULL'
            );
        }

        // ─ 4. Balans tekshiruvi ────────────────────────────────────────────
        // 100% chegirmada bepul → balans tekshirilmaydi
        // skipBalanceCheck=true (faqat admin/manager override) → ham tekshirilmaydi
        if (!skipBalanceCheck && discountPct < 100 && this.paymentRepo) {
            await this._checkBalance(studentId, groupId, discountPct);
        }

        // ─ 5. Atomik yozuv ────────────────────────────────────
        return withTransaction(async (client) => {
            const enrollment = await this.enrollmentRepo.create(
                { groupId, studentId, discountPct, notes },
                client
            );

            // Joriy oy uchun avtomatik qarz yaratish
            await this._createInitialDebt(
                enrollment.id, studentId, groupId, discountPct, client
            );

            return {
                enrollment,
                group: {
                    id: group.id,
                    name: group.name,
                    currentStudents: currentCount + 1,
                    maxStudents: group.maxStudents,
                    availableSpots: group.maxStudents - currentCount - 1,
                },
            };
        });
    }

    // ════════════════════════════════════════════════════════
    // STATUS O'ZGARTIRISH
    // ════════════════════════════════════════════════════════

    async changeStatus(
        enrollmentId: number,
        status: EnrollmentStatus,
        leftAt?: string
    ) {
        const enrollment = await this.enrollmentRepo.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Yozilish topilmadi', 404, 'ENROLLMENT_NOT_FOUND');
        }

        if (enrollment.status === 'left' || enrollment.status === 'graduated') {
            throw new AppError(
                `"${enrollment.status}" holatidagi yozilishni o'zgartirib bo'lmaydi`,
                400, 'INVALID_ENROLLMENT_STATUS_CHANGE'
            );
        }

        return this.enrollmentRepo.updateStatus(enrollmentId, status, leftAt);
    }

    async removeStudent(enrollmentId: number): Promise<void> {
        const enrollment = await this.enrollmentRepo.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Yozilish topilmadi', 404, 'ENROLLMENT_NOT_FOUND');
        }
        await this.enrollmentRepo.softDelete(enrollmentId);
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE: Balans tekshiruvi (PaymentRepository orqali)
    //
    //  Talabaning joriy balansi (to'lovlar − qarzlar) bitta dars
    //  narxidan kam bo'lsa INSUFFICIENT_BALANCE xatosi.
    //
    //  Hisoblash:
    //    oylik_narx  = kurs_narxi × (1 − discountPct/100)
    //    dars_narxi  = oylik_narx / (lessonsPerWeek × 4)
    //    balance     = totalPaid − totalDebt
    // ════════════════════════════════════════════════════════

    private async _checkBalance(
        studentId: number,
        groupId: number,
        discountPct: number
    ): Promise<void> {
        // PaymentRepository dan balansni olish
        const { balance } = await this.paymentRepo!.getStudentBalance(studentId);

        // Kurs narxini olish
        const [priceRow] = await import('../config/database').then(db =>
            db.query<{ price: string; lessons_per_week: string }>(
                `SELECT c.price_per_month AS price, c.lessons_per_week
                 FROM groups g JOIN courses c ON c.id = g.course_id
                 WHERE g.id = $1`,
                [groupId]
            )
        );

        if (!priceRow) return; // Narx topilmasa tekshirmaymiz

        const monthlyPrice = parseFloat(priceRow.price) * (1 - discountPct / 100);
        const lessonsPerMonth = parseInt(priceRow.lessons_per_week) * 4;
        const perLessonPrice = monthlyPrice / lessonsPerMonth;

        if (balance < perLessonPrice) {
            throw new AppError(
                `Talabaning balansi yetarli emas. ` +
                `Joriy balans: ${balance.toFixed(0)} so'm. ` +
                `Bitta dars narxi: ${perLessonPrice.toFixed(0)} so'm. ` +
                `Zamin: avval /api/finance/payments orqali to'lov qiling.`,
                400,
                'INSUFFICIENT_BALANCE'
            );
        }
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE: Joriy oy uchun dastlabki qarz yaratish
    //
    //  Talaba guruhga qo'shilgach, shu oyning qarz yozuvi
    //  payment_debts jadvaliga qo'shiladi.
    // ════════════════════════════════════════════════════════

    private async _createInitialDebt(
        enrollmentId: number,
        studentId: number,
        groupId: number,
        discountPct: number,
        client: import('pg').PoolClient
    ): Promise<void> {
        const priceRows = await client.query(
            `SELECT c.price_per_month FROM groups g
             JOIN courses c ON c.id = g.course_id
             WHERE g.id = $1`,
            [groupId]
        );

        if (!priceRows.rows[0]) return;

        const monthlyPrice = parseFloat(priceRows.rows[0].price_per_month);
        const discountedPrice = monthlyPrice * (1 - discountPct / 100);

        // Joriy oyning 1-kuni (due_month)
        const now = new Date();
        const dueMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString().split('T')[0];

        // Muddati — shu oyning 5-kuni
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 5)
            .toISOString().split('T')[0];

        await client.query(
            `INSERT INTO payment_debts
               (enrollment_id, student_id, due_month, amount_due, due_date, status)
             VALUES ($1, $2, $3::DATE, $4, $5::DATE, 'pending')
             ON CONFLICT (enrollment_id, due_month) DO NOTHING`,
            [
                enrollmentId,
                studentId,
                dueMonth,
                discountedPrice.toFixed(2),
                dueDate,
            ]
        );
    }
}
