import { query } from '../config/database';
import { User } from '../domain/entities/user.entity';
import { IUserRepository } from '../domain/interfaces/repository.interface';

// ============================================================
// USER REPOSITORY
// Mas'uliyat: FAQAT ma'lumotlar bazasi bilan muloqot.
// Biznes mantiqi bu yerda bo'lmasligi kerak.
// ============================================================

/**
 * DATABASE ROW → DOMAIN OBJECT:  snake_case → camelCase
 */
function mapRowToUser(row: Record<string, unknown>): User {
    return {
        id: row.id as number,
        roleId: row.role_id as number,
        roleName: row.role_name as User['roleName'],
        firstName: row.first_name as string,
        lastName: row.last_name as string,
        phone: row.phone as string,
        email: row.email as string | null,
        passwordHash: row.password_hash as string,
        isActive: row.is_active as boolean,
        avatarUrl: row.avatar_url as string | null,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    };
}

// Barcha o'qish so'rovlari uchun umumiy SELECT (roles JOIN bilan)
const BASE_SELECT = `
  SELECT
    u.id,
    u.role_id,
    r.name    AS role_name,
    u.first_name,
    u.last_name,
    u.phone,
    u.email,
    u.password_hash,
    u.is_active,
    u.avatar_url,
    u.created_at,
    u.updated_at,
    u.deleted_at
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE u.deleted_at IS NULL
`;

export class UserRepository implements IUserRepository {

    // ══════════════════════════════════════════════════════════════
    // O'QISH METODLARI (Read)
    // ══════════════════════════════════════════════════════════════

    /**
     * ID bo'yicha bitta foydalanuvchi topish.
     * @returns User ob'ekti yoki null (topilmasa)
     */
    async findById(id: number): Promise<User | null> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND u.id = $1`,
            [id]
        );
        return rows.length ? mapRowToUser(rows[0]) : null;
    }

    /**
     * Telefon raqami bo'yicha foydalanuvchi topish.
     * Login va telefon unikalligi tekshiruvi uchun ishlatiladi.
     */
    async findByPhone(phone: string): Promise<User | null> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND u.phone = $1`,
            [phone]
        );
        return rows.length ? mapRowToUser(rows[0]) : null;
    }

    /**
     * Email manzili bo'yicha foydalanuvchi topish.
     */
    async findByEmail(email: string): Promise<User | null> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND u.email = $1`,
            [email]
        );
        return rows.length ? mapRowToUser(rows[0]) : null;
    }

    /**
     * Barcha foydalanuvchilar ro'yxati — filter va sahifalash bilan.
     *
     * @param options.roleId   - Rol bo'yicha filterlash (ixtiyoriy)
     * @param options.isActive - Faollik holati bo'yicha filterlash (ixtiyoriy)
     * @param options.search   - Ism, familiya yoki telefon bo'yicha qidiruv (ixtiyoriy)
     * @param options.limit    - Sahifadagi yozuvlar soni (standart: 20)
     * @param options.offset   - Nechadan boshlash (standart: 0)
     * @returns { data: User[], total: number }
     */
    async findAll(options: {
        roleId?: number;
        isActive?: boolean;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: User[]; total: number }> {
        const { roleId, isActive, search, limit = 20, offset = 0 } = options;

        // Dinamik WHERE shartlari (SQL injection xavfsiz — parametr binding)
        const conditions: string[] = ['u.deleted_at IS NULL'];
        const params: unknown[] = [];
        let idx = 1;

        if (roleId !== undefined) {
            conditions.push(`u.role_id = $${idx++}`);
            params.push(roleId);
        }
        if (isActive !== undefined) {
            conditions.push(`u.is_active = $${idx++}`);
            params.push(isActive);
        }
        if (search?.trim()) {
            // Bitta parametr — 3 ta ustunda qidirish (ILIKE = case-insensitive)
            conditions.push(
                `(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.phone ILIKE $${idx})`
            );
            params.push(`%${search.trim()}%`);
            idx++;
        }

        const where = conditions.join(' AND ');

        // 1. Sahifalash uchun jami yozuv soni
        const [countRow] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count FROM users u WHERE ${where}`,
            params
        );
        const total = parseInt(countRow?.count ?? '0', 10);

        // 2. Haqiqiy ma'lumotlar — LIMIT + OFFSET bilan
        const rows = await query<Record<string, unknown>>(
            `SELECT
               u.id, u.role_id, r.name AS role_name,
               u.first_name, u.last_name, u.phone, u.email,
               u.password_hash, u.is_active, u.avatar_url,
               u.created_at, u.updated_at, u.deleted_at
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE ${where}
             ORDER BY u.created_at DESC
             LIMIT $${idx++} OFFSET $${idx}`,
            [...params, limit, offset]
        );

        return { data: rows.map(mapRowToUser), total };
    }

    // ══════════════════════════════════════════════════════════════
    // YARATISH (Create)
    // ══════════════════════════════════════════════════════════════

    /**
     * Yangi foydalanuvchi yaratish va bazaga saqlash.
     *
     * ⚠️ passwordHash — bcrypt bilan allaqachon hash qilingan bo'lsin!
     *    Oddiy text parolni bu yerga BERMA.
     *
     * @returns Yaratilgan User ob'ekti (rol nomi bilan birga)
     */
    async create(data: {
        roleId: number;
        firstName: string;
        lastName: string;
        phone: string;
        passwordHash: string;
        email?: string | null;
        avatarUrl?: string | null;
    }): Promise<User> {
        const rows = await query<Record<string, unknown>>(
            `INSERT INTO users
               (role_id, first_name, last_name, phone, email, password_hash, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                data.roleId,
                data.firstName,
                data.lastName,
                data.phone,
                data.email ?? null,
                data.passwordHash,
                data.avatarUrl ?? null,
            ]
        );

        // Rol nomi JOIN bilan kelishi uchun findById ishlatamiz
        return (await this.findById(rows[0].id as number))!;
    }

    // ══════════════════════════════════════════════════════════════
    // YANGILASH (Update)
    // ══════════════════════════════════════════════════════════════

    /**
     * Foydalanuvchi ma'lumotlarini qisman yangilash (PATCH semantikasi).
     * Faqat berilgan maydonlar yangilanadi — qolganlar o'zgarmaydi.
     *
     * @example
     *   await userRepo.update(5, { isActive: false });
     *   await userRepo.update(5, { firstName: 'Ali', phone: '+998901234567' });
     */
    async update(
        id: number,
        data: Partial<{
            firstName: string;
            lastName: string;
            phone: string;
            email: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            roleId: number;
        }>
    ): Promise<User | null> {
        // Dinamik SET qismi — faqat berilgan maydonlar
        const setClauses: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        // TypeScript key → SQL ustun nomi xaritalash
        const fieldMap: Record<string, string> = {
            firstName: 'first_name',
            lastName: 'last_name',
            phone: 'phone',
            email: 'email',
            avatarUrl: 'avatar_url',
            isActive: 'is_active',
            roleId: 'role_id',
        };

        for (const [tsKey, sqlCol] of Object.entries(fieldMap)) {
            if (tsKey in data && (data as Record<string, unknown>)[tsKey] !== undefined) {
                setClauses.push(`${sqlCol} = $${idx++}`);
                params.push((data as Record<string, unknown>)[tsKey]);
            }
        }

        // Hech narsa berilmagan bo'lsa — o'zgarishsiz qaytaramiz
        if (setClauses.length === 0) return this.findById(id);

        params.push(id);
        await query(
            `UPDATE users
             SET    ${setClauses.join(', ')}
             WHERE  id = $${idx} AND deleted_at IS NULL`,
            params
        );

        return this.findById(id);
    }

    /**
     * Foydalanuvchi parolini yangilash.
     *
     * ⚠️ newPasswordHash — bcrypt bilan allaqachon hash qilingan bo'lsin!
     */
    async updatePassword(id: number, newPasswordHash: string): Promise<void> {
        await query(
            `UPDATE users
             SET    password_hash = $1
             WHERE  id = $2 AND deleted_at IS NULL`,
            [newPasswordHash, id]
        );
    }

    // ══════════════════════════════════════════════════════════════
    // O'CHIRISH (Soft Delete)
    // ══════════════════════════════════════════════════════════════

    /**
     * Foydalanuvchini mantiqiy o'chirish (Soft Delete).
     * Haqiqiy DELETE ishlatilmaydi — deleted_at to'ldiriladi.
     * Bu ma'lumot tarixini saqlab qoladi va audit imkonini beradi.
     */
    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE users
             SET    deleted_at = NOW(),
                    is_active  = FALSE
             WHERE  id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    // ══════════════════════════════════════════════════════════════
    // UNIQUE TEKSHIRUV (Validation uchun yordamchi)
    // ══════════════════════════════════════════════════════════════

    /**
     * Telefon yoki email allaqachon bazada mavjudligini tekshirish.
     * Yangi foydalanuvchi yaratish yoki telefon/email yangilashdan oldin chaqiriladi.
     *
     * @param excludeId - Yangilashda o'z ID sini hisobga olmaslik uchun (ixtiyoriy)
     */
    async existsByPhoneOrEmail(
        phone: string,
        email?: string | null,
        excludeId?: number
    ): Promise<{ phoneExists: boolean; emailExists: boolean }> {
        const excl = excludeId ? `AND id <> ${excludeId}` : '';

        const [phoneRow] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM users
             WHERE phone = $1 AND deleted_at IS NULL ${excl}`,
            [phone]
        );

        let emailExists = false;
        if (email) {
            const [emailRow] = await query<{ count: string }>(
                `SELECT COUNT(*) AS count
                 FROM users
                 WHERE email = $1 AND deleted_at IS NULL ${excl}`,
                [email]
            );
            emailExists = parseInt(emailRow?.count ?? '0', 10) > 0;
        }

        return {
            phoneExists: parseInt(phoneRow?.count ?? '0', 10) > 0,
            emailExists,
        };
    }
}
