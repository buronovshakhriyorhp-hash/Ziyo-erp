import { query, withTransaction } from '../config/database';
import { PoolClient } from 'pg';

// ============================================================
// ENROLLMENT REPOSITORY
// Mas'uliyat: group_enrollments jadvali bilan muloqot.
//   Asosiy murakkab logika:
//   - Guruh sig'imini (capacity) tekshirish
//   - Talabaning guruhda ikki marta yozilmasligini tekshirish
// ============================================================

export interface Enrollment {
    id: number;
    groupId: number;
    groupName: string;
    studentId: number;
    studentFullName: string;
    studentPhone: string;
    courseName: string;
    enrolledAt: string;
    leftAt: string | null;
    status: EnrollmentStatus;
    discountPct: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export type EnrollmentStatus = 'active' | 'frozen' | 'left' | 'graduated';

export interface CreateEnrollmentData {
    groupId: number;
    studentId: number;
    discountPct?: number;
    notes?: string | null;
}

function mapRow(row: Record<string, unknown>): Enrollment {
    return {
        id: row.id as number,
        groupId: row.group_id as number,
        groupName: row.group_name as string,
        studentId: row.student_id as number,
        studentFullName: row.student_full_name as string,
        studentPhone: row.student_phone as string,
        courseName: row.course_name as string,
        enrolledAt: row.enrolled_at as string,
        leftAt: row.left_at as string | null,
        status: row.status as EnrollmentStatus,
        discountPct: parseFloat(row.discount_pct as string ?? '0'),
        notes: row.notes as string | null,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    };
}

const BASE_SELECT = `
  SELECT
    ge.id,
    ge.group_id,
    g.name                                    AS group_name,
    ge.student_id,
    u.first_name || ' ' || u.last_name        AS student_full_name,
    u.phone                                   AS student_phone,
    c.name                                    AS course_name,
    ge.enrolled_at::TEXT,
    ge.left_at::TEXT,
    ge.status,
    ge.discount_pct,
    ge.notes,
    ge.created_at,
    ge.updated_at,
    ge.deleted_at
  FROM group_enrollments ge
  JOIN groups g ON g.id = ge.group_id
  JOIN courses c ON c.id = g.course_id
  JOIN student_profiles sp ON sp.id = ge.student_id
  JOIN users u ON u.id = sp.user_id
  WHERE ge.deleted_at IS NULL
`;

export class EnrollmentRepository {

    // ════════════════════════════════════════════════════════
    // O'QISH
    // ════════════════════════════════════════════════════════

    async findById(id: number): Promise<Enrollment | null> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND ge.id = $1`, [id]
        );
        return rows.length ? mapRow(rows[0]) : null;
    }

    async findByGroupId(groupId: number): Promise<Enrollment[]> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND ge.group_id = $1 AND ge.status = 'active'
             ORDER BY ge.enrolled_at`, [groupId]
        );
        return rows.map(mapRow);
    }

    async findByStudentId(studentId: number): Promise<Enrollment[]> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND ge.student_id = $1
             ORDER BY ge.enrolled_at DESC`, [studentId]
        );
        return rows.map(mapRow);
    }

    // ════════════════════════════════════════════════════════
    // CAPACITY TEKSHIRUVI
    // ════════════════════════════════════════════════════════

    /**
     * Guruhdagi AKTIV talabalar sonini qaytaradi.
     * create() dan OLDIN chaqirib, max_students bilan taqqoslanadi.
     */
    async countActiveStudents(groupId: number): Promise<number> {
        const [row] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM group_enrollments
             WHERE group_id = $1
               AND status = 'active'
               AND deleted_at IS NULL`,
            [groupId]
        );
        return parseInt(row?.count ?? '0', 10);
    }

    /**
     * Talabaning ushbu guruhda faol yozilishi borligini tekshiradi.
     * Ikki marta yozilishni oldini olish uchun ishlatiladi.
     *
     * @returns true — talaba allaqachon yozilgan
     */
    async isStudentAlreadyEnrolled(groupId: number, studentId: number): Promise<boolean> {
        const [row] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM group_enrollments
             WHERE group_id  = $1
               AND student_id = $2
               AND status    IN ('active','frozen')
               AND deleted_at IS NULL`,
            [groupId, studentId]
        );
        return parseInt(row?.count ?? '0', 10) > 0;
    }

    // ════════════════════════════════════════════════════════
    // YARATISH (Bir tranzaksiya ichida — thread safe)
    // ════════════════════════════════════════════════════════

    async create(
        data: CreateEnrollmentData,
        client?: PoolClient
    ): Promise<Enrollment> {
        const exec = client
            ? async (sql: string, p: unknown[]) => {
                const r = await client.query(sql, p);
                return r.rows as Record<string, unknown>[];
            }
            : (sql: string, p: unknown[]) => query<Record<string, unknown>>(sql, p);

        if (client) await client.query('SET search_path = erp');

        const rows = await exec(
            `INSERT INTO group_enrollments
               (group_id, student_id, discount_pct, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                data.groupId,
                data.studentId,
                data.discountPct ?? 0,
                data.notes ?? null,
            ]
        );

        const newId = (rows[0]).id as number;

        // BUG FIX: findById within a transaction MUST use the same client,
        // otherwise the uncommitted INSERT is invisible to a new pool connection.
        if (client) {
            const { rows: selRows } = await client.query(
                `${BASE_SELECT} AND ge.id = $1`,
                [newId]
            );
            if (!selRows.length) throw new Error('Enrollment not found after insert');
            return mapRow(selRows[0] as Record<string, unknown>);
        }
        return (await this.findById(newId))!;
    }

    // ════════════════════════════════════════════════════════
    // STATUS O'ZGARTIRISH
    // ════════════════════════════════════════════════════════

    /**
     * Talabaning guruhdan statusini o'zgartirish
     * @param leftAt  - 'left' statusida guruhdan ketish sanasi
     */
    async updateStatus(
        id: number,
        status: EnrollmentStatus,
        leftAt?: string
    ): Promise<Enrollment | null> {
        await query(
            `UPDATE group_enrollments
             SET status  = $1,
                 left_at = COALESCE($2::DATE, left_at)
             WHERE id = $3 AND deleted_at IS NULL`,
            [status, leftAt ?? null, id]
        );
        return this.findById(id);
    }

    // ════════════════════════════════════════════════════════
    // SOFT DELETE
    // ════════════════════════════════════════════════════════

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE group_enrollments
             SET deleted_at = NOW(),
                 status     = 'left',
                 left_at    = CURRENT_DATE
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
