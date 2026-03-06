import { LeadRepository, Lead } from '../repositories/lead.repository';
import { AppError } from '../utils/api-response.util';
import { withTransaction, withAuditContext } from '../config/database';
import { hashPassword } from '../utils/password.util';

// ============================================================
// LEAD SERVICE
// Mas'uliyat: CRM biznes mantiqi.
//
//   Asosiy murakkablik:
//   LEAD → STUDENT KONVERSIYASI:
//     Lid "yozildi" statusiga o'tganda avtomatik ravishda:
//     1. users jadvaliga yangi foydalanuvchi yaratiladi
//     2. student_profiles jadvaliga profil yaratiladi
//     3. Lid ning student_id va converted_at yangilanadi
//     4. Barcha amallar bitta tranzaksiya ichida (atomik)
// ============================================================

// "Yozildi" status nomi — DB dagi lead_statuses jadvalidan
const REGISTERED_STATUS_NAME = 'Yozildi';

export interface CreateLeadDto {
    fullName: string;
    phone: string;
    email?: string | null;
    sourceId?: number | null;
    statusId: number;
    assignedTo?: number | null;
    courseInterest?: string | null;
    notes?: string | null;
}

export interface UpdateLeadDto {
    fullName?: string;
    email?: string | null;
    sourceId?: number | null;
    statusId?: number;
    assignedTo?: number | null;
    courseInterest?: string | null;
    notes?: string | null;
}

export interface AddCallDto {
    leadId: number;
    calledBy: number;     // Chaqirayotgan menejer user.id — JWT dan olinadi
    durationSec?: number;
    callType?: 'inbound' | 'outbound';
    result?: string | null;
    nextCallAt?: string | null;
    notes?: string | null;
}

export class LeadService {
    constructor(private readonly leadRepo: LeadRepository) { }

    // ════════════════════════════════════════════════════════
    // RO'YXAT VA BITTA TOPISH
    // ════════════════════════════════════════════════════════

    async list(options: {
        statusId?: number;
        assignedTo?: number;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.leadRepo.findAll({ ...rest, limit, offset });
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getById(id: number) {
        const lead = await this.leadRepo.findById(id);
        if (!lead) throw new AppError('Lid topilmadi', 404, 'LEAD_NOT_FOUND');
        return lead;
    }

    // ════════════════════════════════════════════════════════
    // YARATISH
    // ════════════════════════════════════════════════════════

    async create(dto: CreateLeadDto) {
        const existing = await this.leadRepo.findByPhone(dto.phone);
        if (existing) {
            throw new AppError(
                `Bu telefon raqami bilan lid allaqachon mavjud (ID: ${existing.id})`,
                409,
                'LEAD_PHONE_DUPLICATE'
            );
        }
        return this.leadRepo.create(dto);
    }

    // ════════════════════════════════════════════════════════
    // YANGILASH + STATUS O'ZGARTIRISH
    // ════════════════════════════════════════════════════════

    /**
     * Lid ma'lumotlarini yangilash.
     *
     * ⚡ Agar status "Yozildi" ga o'tsa — avtomatik konversiya boshlanadi:
     *    → convertToStudent() tranzaksiyasi ichida users + student_profiles yaratiladi.
     *    Bu holda metod konversiya natijasini qaytaradi (userId, studentId, tempPassword).
     */
    async update(
        id: number,
        dto: UpdateLeadDto,
        reqContext: {
            managerId: number;
            managerName: string;
            ip: string;
            ua: string;
        }
    ) {
        const lead = await this.getById(id);

        // Agar status "Yozildi" ga o'tsa — avto-konversiya
        if (dto.statusId && !lead.studentId) {
            const statusName = await this._getStatusName(dto.statusId);
            if (statusName === REGISTERED_STATUS_NAME) {
                // Konversiya qilish uchun context kerak!
                // Biz buni controllerdan berdik
                return this.convertToStudent(id, reqContext);
            }
        }

        return this.leadRepo.update(id, dto);
    }

    // ════════════════════════════════════════════════════════
    // LEAD → STUDENT KONVERSIYASI
    // ════════════════════════════════════════════════════════

    /**
     * CRM lidni to'liq ro'yxatdan o'tkazilgan talabaga aylantirish.
     *
     * Atomik tranzaksiya ichida bajariladi (ya hammasi, ya hech narsa):
     *
     *   1. Lid mavjudligini tekshirish
     *   2. Allaqachon konvertsiya qilinganmi? → xato
     *   3. Telefon users jadvalida bormi? → xato
     *   4. users jadvaliga yangi foydalanuvchi yaratish (talaba roli)
     *   5. student_profiles jadvaliga profil yaratish
     *   6. Lid yozuvini yangilash:
     *      - status_id = 'Yozildi' status ID si
     *      - student_id = yangi yaratilgan student_profile.id
     *      - converted_at = NOW()
     *   7. Konversiya haqida call_log yozish (managerId bilan)
     *
     * @param leadId     - Konvertatsiya qilinadigan lid ID si
     * @param extraData  - Talaba profili uchun qo'shimcha ma'lumotlar
     * @param managerId  - Konversiyani bajargan menejer user.id (JWT dan)
     */
    async convertToStudent(
        leadId: number,
        reqContext: {
            managerId: number;
            managerName: string;
            ip: string;
            ua: string;
        },
        extraData?: {
            birthDate?: string | null;
            address?: string | null;
            schoolName?: string | null;
            grade?: number | null;
        }
    ): Promise<{
        userId: number;
        studentId: number;
        lead: Lead;
        tempPassword: string;  // ⚠️ SMS/email orqali talabaga yuboring!
    }> {
        const lead = await this.getById(leadId);

        // Allaqachon konvertatsiya qilinganmi?
        if (lead.studentId || lead.convertedAt) {
            throw new AppError(
                'Bu lid allaqachon talabaga aylantirilgan',
                409,
                'LEAD_ALREADY_CONVERTED'
            );
        }

        const { query: dbQuery } = await import('../config/database');

        // Telefon users jadvalida bormi?
        const [existingUser] = await dbQuery<{ id: number }>(
            `SELECT id FROM users WHERE phone = $1 AND deleted_at IS NULL`,
            [lead.phone]
        );
        if (existingUser) {
            throw new AppError(
                `Bu telefon raqami bilan foydalanuvchi allaqachon mavjud (ID: ${existingUser.id})`,
                409,
                'USER_PHONE_DUPLICATE'
            );
        }

        // "Talaba" rol ID sini topish
        const [studentRole] = await dbQuery<{ id: number }>(
            `SELECT id FROM roles WHERE name = 'student' AND deleted_at IS NULL`
        );
        if (!studentRole) {
            throw new AppError('Tizimda "student" roli topilmadi', 500, 'ROLE_NOT_FOUND');
        }

        // "Yozildi" status ID sini topish
        const [registeredStatus] = await dbQuery<{ id: number }>(
            `SELECT id FROM lead_statuses WHERE name = $1`,
            [REGISTERED_STATUS_NAME]
        );

        // ── TRANZAKSIYA ───────────────────────────────────────────
        return withAuditContext(
            reqContext.managerId,
            reqContext.managerName,
            reqContext.ip,
            reqContext.ua,
            async (client) => {
                await client.query('SET search_path = erp');

                // 1. Vaqtinchalik parol sifatida telefon raqamini saqlaymiz (vaqtincha)
                const tempPassword = lead.phone;
                const passwordHash = await hashPassword(tempPassword);

                // 2. users jadvaliga yangi foydalanuvchi
                const [newUser] = (
                    await client.query(
                        `INSERT INTO users
                       (role_id, first_name, last_name, phone, email, password_hash)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id`,
                        [
                            studentRole.id,
                            lead.fullName.split(' ')[0] || lead.fullName,
                            lead.fullName.split(' ').slice(1).join(' ') || '',
                            lead.phone,
                            lead.email,
                            passwordHash,
                        ]
                    )
                ).rows;

                // 3. student_profiles jadvaliga profil
                const [newStudentProfile] = (
                    await client.query(
                        `INSERT INTO student_profiles
                       (user_id, birth_date, address, school_name, grade)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                        [
                            newUser.id,
                            extraData?.birthDate ?? null,
                            extraData?.address ?? null,
                            extraData?.schoolName ?? null,
                            extraData?.grade ?? null,
                        ]
                    )
                ).rows;

                // 4. Lid yozuvini yangilash
                await client.query(
                    `UPDATE leads
                 SET student_id   = $1,
                     converted_at = NOW(),
                     status_id    = COALESCE($2, status_id)
                 WHERE id = $3`,
                    [
                        newStudentProfile.id,
                        registeredStatus?.id ?? null,
                        leadId,
                    ]
                );

                // 5. Konversiya haqida qo'ng'iroq logi yozish (haqiqiy menejer bilan)
                const callerUserId = reqContext.managerId ?? newUser.id;
                await client.query(
                    `INSERT INTO call_logs
                   (lead_id, called_by, call_type, result, notes)
                 VALUES ($1, $2, 'outbound', 'answered', $3)`,
                    [
                        leadId,
                        callerUserId,
                        `Talabaga aylantirildi. User ID: ${newUser.id}, ` +
                        `Student Profile ID: ${newStudentProfile.id}`,
                    ]
                );

                const updatedLead = await this.leadRepo.findById(leadId);

                return {
                    userId: newUser.id,
                    studentId: newStudentProfile.id,
                    lead: updatedLead!,
                    tempPassword,   // ⚠️ Bir marta ko'rsatiladi — SMS/email orqali yuborilsin!
                };
            });
    }

    // ════════════════════════════════════════════════════════
    // QO'NG'IROQ TARIXI
    // ════════════════════════════════════════════════════════

    async addCallLog(dto: AddCallDto) {
        await this.getById(dto.leadId); // lid mavjudligini tekshirish
        return this.leadRepo.addCallLog(dto);
    }

    async getCallHistory(leadId: number) {
        await this.getById(leadId);
        return this.leadRepo.getCallLogs(leadId);
    }

    /**
     * Barcha qo'ng'iroqlar — menejer dashboardi uchun.
     * Filter: calledBy (menejer), leadId, fromDate, toDate, page, limit
     */
    async listAllCallLogs(options: {
        calledBy?: number;
        leadId?: number;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
    }) {
        const { page = 1, limit = 20, ...rest } = options;
        const offset = (page - 1) * limit;
        const { data, total } = await this.leadRepo.getAllCallLogs({ ...rest, limit, offset });
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Kelajakda rejalashtirilgan qo'ng'iroqlar eslatmasi.
     * next_call_at bo'yicha o'sish tartibida.
     */
    async getUpcomingReminders(calledBy?: number) {
        return this.leadRepo.getUpcomingCalls({ calledBy });
    }

    /**
     * Qo'ng'iroq logini o'chirish (soft delete).
     */
    async deleteCallLog(callLogId: number): Promise<void> {
        await this.leadRepo.softDeleteCallLog(callLogId);
    }

    // ════════════════════════════════════════════════════════
    // O'CHIRISH (SOFT DELETE)
    // ════════════════════════════════════════════════════════

    async delete(id: number): Promise<void> {
        const lead = await this.getById(id);

        // Konvertsiya qilingan lidni o'chirib bo'lmaydi
        if (lead.studentId) {
            throw new AppError(
                'Talabaga aylantirilgan lidni o\'chirib bo\'lmaydi',
                400,
                'CONVERTED_LEAD_CANNOT_BE_DELETED'
            );
        }

        await this.leadRepo.softDelete(id);
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE
    // ════════════════════════════════════════════════════════

    private async _getStatusName(statusId: number): Promise<string> {
        const { query: dbQuery } = await import('../config/database');
        const [row] = await dbQuery<{ name: string }>(
            `SELECT name FROM lead_statuses WHERE id = $1`, [statusId]
        );
        return row?.name ?? '';
    }
}
