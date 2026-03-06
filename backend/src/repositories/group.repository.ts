import { query, withTransaction } from '../config/database';
import { PoolClient } from 'pg';

// ============================================================
// GROUP REPOSITORY
// Mas'uliyat: groups jadvali bilan to'liq muloqot.
//   Asosiy murakkab logika: O'qituvchi va Xona CONFLICT tekshiruvi
// ============================================================

// ──────────────────────────────────────────────────────────────
// DOMAIN TYPES
// ──────────────────────────────────────────────────────────────

export interface Group {
    id: number;
    courseId: number;
    courseName: string;
    teacherId: number;
    teacherFullName: string;
    roomId: number | null;
    roomName: string | null;
    dayComboId: number | null;
    dayComboName: string | null;
    days: string[];
    name: string;
    startTime: string;       // "09:00"
    endTime: string;       // "10:30"
    startDate: string;       // "2024-01-01"
    endDate: string | null;
    maxStudents: number;
    currentStudents: number;       // Hozirgi talabalar soni (COUNT)
    status: GroupStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export type GroupStatus = 'recruiting' | 'active' | 'completed' | 'cancelled';

export interface CreateGroupData {
    courseId: number;
    teacherId: number;
    roomId?: number | null;
    dayComboId?: number | null;
    name: string;
    startTime: string;
    endTime: string;
    startDate: string;
    endDate?: string | null;
    maxStudents?: number;
}

// Conflict tekshiruvi natijasi
export interface ConflictResult {
    hasConflict: boolean;
    conflictType?: 'teacher' | 'room';
    conflictGroup?: { id: number; name: string; startTime: string; endTime: string };
}

// ──────────────────────────────────────────────────────────────
// MAPPER
// ──────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Group {
    return {
        id: row.id as number,
        courseId: row.course_id as number,
        courseName: row.course_name as string,
        teacherId: row.teacher_id as number,
        teacherFullName: row.teacher_full_name as string,
        roomId: row.room_id as number | null,
        roomName: row.room_name as string | null,
        dayComboId: row.day_combination_id as number | null,
        dayComboName: row.day_combo_name as string | null,
        days: (row.days as string[]) ?? [],
        name: row.name as string,
        startTime: row.start_time as string,
        endTime: row.end_time as string,
        startDate: row.start_date as string,
        endDate: row.end_date as string | null,
        maxStudents: row.max_students as number,
        currentStudents: parseInt(row.current_students as string ?? '0', 10),
        status: row.status as GroupStatus,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
    };
}

// Asosiy SELECT (JOIN bilan)
const BASE_SELECT = `
  SELECT
    g.id,
    g.course_id,
    c.name            AS course_name,
    g.teacher_id,
    tp.id             AS teacher_profile_id,
    u.first_name || ' ' || u.last_name AS teacher_full_name,
    g.room_id,
    r.name            AS room_name,
    g.day_combination_id,
    dc.name           AS day_combo_name,
    dc.days,
    g.name,
    g.start_time::TEXT,
    g.end_time::TEXT,
    g.start_date::TEXT,
    g.end_date::TEXT,
    g.max_students,
    g.status,
    g.created_at,
    g.updated_at,
    g.deleted_at,
    COUNT(ge.id) FILTER (WHERE ge.status = 'active' AND ge.deleted_at IS NULL)
                                              AS current_students
  FROM groups g
  JOIN courses c ON c.id = g.course_id
  JOIN teacher_profiles tp ON tp.id = g.teacher_id
  JOIN users u ON u.id = tp.user_id
  LEFT JOIN rooms r ON r.id = g.room_id
  LEFT JOIN day_combinations dc ON dc.id = g.day_combination_id
  LEFT JOIN group_enrollments ge ON ge.group_id = g.id
  WHERE g.deleted_at IS NULL
`;
const GROUP_BY = `
  GROUP BY g.id, c.name, tp.id, u.first_name, u.last_name,
           r.name, dc.name, dc.days
`;

// ──────────────────────────────────────────────────────────────
// REPOSITORY SINFI
// ──────────────────────────────────────────────────────────────

export class GroupRepository {

    // ════════════════════════════════════════════════════════
    // O'QISH
    // ════════════════════════════════════════════════════════

    async findById(id: number): Promise<Group | null> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND g.id = $1 ${GROUP_BY}`, [id]
        );
        return rows.length ? mapRow(rows[0]) : null;
    }

    async findAll(options: {
        courseId?: number;
        teacherId?: number;
        status?: GroupStatus;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Group[]; total: number }> {
        const { courseId, teacherId, status, search, limit = 20, offset = 0 } = options;

        const conditions: string[] = ['g.deleted_at IS NULL'];
        const params: unknown[] = [];
        let idx = 1;

        if (courseId) { conditions.push(`g.course_id  = $${idx++}`); params.push(courseId); }
        if (teacherId) { conditions.push(`g.teacher_id = $${idx++}`); params.push(teacherId); }
        if (status) { conditions.push(`g.status     = $${idx++}`); params.push(status); }
        if (search?.trim()) {
            conditions.push(`(g.name ILIKE $${idx} OR c.name ILIKE $${idx})`);
            params.push(`%${search.trim()}%`);
            idx++;
        }

        const where = conditions.join(' AND ');

        // Jami soni
        const [countRow] = await query<{ count: string }>(
            `SELECT COUNT(DISTINCT g.id) AS count
             FROM groups g JOIN courses c ON c.id = g.course_id
             WHERE ${where}`,
            params
        );
        const total = parseInt(countRow?.count ?? '0', 10);

        // Ma'lumotlar
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT.replace('WHERE g.deleted_at IS NULL', `WHERE ${where}`)}
             ${GROUP_BY}
             ORDER BY g.created_at DESC
             LIMIT $${idx++} OFFSET $${idx}`,
            [...params, limit, offset]
        );

        return { data: rows.map(mapRow), total };
    }

    // ════════════════════════════════════════════════════════
    // CONFLICT DETECTION — O'qituvchi va Xona band emasligini tekshirish
    // ════════════════════════════════════════════════════════

    /**
     * Berilgan o'qituvchi yoki xona uchun vaqt to'qnashuvi borligini tekshiradi.
     *
     * Algoritm:
     *   Dars kunlari kesishadi (days OVERLAP)  AND
     *   Dars vaqti kesishadi (time ranges overlap) AND
     *   Guruh aktiv/yig'ilmoqda holati           AND
     *   Soft-delete qilinmagan
     *
     * @param teacherId   - Tekshiriladigan o'qituvchi
     * @param startTime   - Yangi guruh boshlanish vaqti "HH:MM"
     * @param endTime     - Yangi guruh tugash vaqti "HH:MM"
     * @param days        - Dars kunlari ['MON','WED','FRI']
     * @param excludeId   - Yangilashda o'z ID sini o'tkazib yuborish
     * @param roomId      - Xona ham tekshiriladi (ixtiyoriy)
     */
    async checkTeacherConflict(params: {
        teacherId: number;
        startTime: string;
        endTime: string;
        days: string[];
        excludeId?: number;
        roomId?: number | null;
    }): Promise<ConflictResult> {
        const { teacherId, startTime, endTime, days, excludeId, roomId } = params;

        const excludeClause = excludeId ? `AND g.id <> ${excludeId}` : '';

        // O'qituvchi konflikti
        const teacherRows = await query<Record<string, unknown>>(
            `SELECT g.id, g.name, g.start_time::TEXT, g.end_time::TEXT
             FROM groups g
             JOIN day_combinations dc ON dc.id = g.day_combination_id
             WHERE g.teacher_id = $1
               AND g.status IN ('recruiting','active')
               AND g.deleted_at IS NULL
               ${excludeClause}
               -- Vaqt oraliqlarining kesishishi: A.start < B.end AND A.end > B.start
               AND $2::TIME < g.end_time
               AND $3::TIME > g.start_time
               -- Dars kunlarining kesishishi (PostgreSQL massiv operatori &&)
               AND dc.days && $4::VARCHAR[]
             LIMIT 1`,
            [teacherId, startTime, endTime, days]
        );

        if (teacherRows.length > 0) {
            const cg = teacherRows[0];
            return {
                hasConflict: true,
                conflictType: 'teacher',
                conflictGroup: {
                    id: cg.id as number,
                    name: cg.name as string,
                    startTime: cg.start_time as string,
                    endTime: cg.end_time as string,
                },
            };
        }

        // Xona konflikti (agar xona berilgan bo'lsa)
        if (roomId) {
            const roomRows = await query<Record<string, unknown>>(
                `SELECT g.id, g.name, g.start_time::TEXT, g.end_time::TEXT
                 FROM groups g
                 JOIN day_combinations dc ON dc.id = g.day_combination_id
                 WHERE g.room_id = $1
                   AND g.status IN ('recruiting','active')
                   AND g.deleted_at IS NULL
                   ${excludeClause}
                   AND $2::TIME < g.end_time
                   AND $3::TIME > g.start_time
                   AND dc.days && $4::VARCHAR[]
                 LIMIT 1`,
                [roomId, startTime, endTime, days]
            );

            if (roomRows.length > 0) {
                const cg = roomRows[0];
                return {
                    hasConflict: true,
                    conflictType: 'room',
                    conflictGroup: {
                        id: cg.id as number,
                        name: cg.name as string,
                        startTime: cg.start_time as string,
                        endTime: cg.end_time as string,
                    },
                };
            }
        }

        return { hasConflict: false };
    }

    // ════════════════════════════════════════════════════════
    // YARATISH
    // ════════════════════════════════════════════════════════

    async create(data: CreateGroupData, client?: PoolClient): Promise<Group> {
        const exec = client
            ? (sql: string, p: unknown[]) => client.query(sql, p).then(r => r.rows)
            : (sql: string, p: unknown[]) => query<Record<string, unknown>>(sql, p);

        await exec('SET search_path = erp', []);

        const rows = await exec(
            `INSERT INTO groups
               (course_id, teacher_id, room_id, day_combination_id,
                name, start_time, end_time, start_date, end_date, max_students)
             VALUES ($1,$2,$3,$4,$5,$6::TIME,$7::TIME,$8::DATE,$9::DATE,$10)
             RETURNING id`,
            [
                data.courseId, data.teacherId,
                data.roomId ?? null, data.dayComboId ?? null,
                data.name,
                data.startTime, data.endTime,
                data.startDate, data.endDate ?? null,
                data.maxStudents ?? 15,
            ]
        );

        return (await this.findById((rows[0] as Record<string, unknown>).id as number))!;
    }

    // ════════════════════════════════════════════════════════
    // YANGILASH
    // ════════════════════════════════════════════════════════

    async updateStatus(id: number, status: GroupStatus): Promise<Group | null> {
        await query(
            `UPDATE groups SET status = $1 WHERE id = $2 AND deleted_at IS NULL`,
            [status, id]
        );
        return this.findById(id);
    }

    async update(
        id: number,
        data: Partial<CreateGroupData>
    ): Promise<Group | null> {
        const set: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        const map: Record<string, string> = {
            courseId: 'course_id', teacherId: 'teacher_id',
            roomId: 'room_id', dayComboId: 'day_combination_id',
            name: 'name', startTime: 'start_time', endTime: 'end_time',
            startDate: 'start_date', endDate: 'end_date', maxStudents: 'max_students',
        };

        for (const [k, col] of Object.entries(map)) {
            if (k in data) {
                set.push(`${col} = $${idx++}`);
                params.push((data as Record<string, unknown>)[k]);
            }
        }

        if (set.length === 0) return this.findById(id);
        params.push(id);

        await query(
            `UPDATE groups SET ${set.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`,
            params
        );
        return this.findById(id);
    }

    // ════════════════════════════════════════════════════════
    // SOFT DELETE
    // ════════════════════════════════════════════════════════

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE groups
             SET deleted_at = NOW(), status = 'cancelled'
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }
}
