import { query, withTransaction } from '../config/database';

// ============================================================
// LESSON REPOSITORY
// Jadval: lessons
//
// ⚠️ Asosiy murakkablik: ROOM CONFLICT DETECTION
//   Bir xonada bir vaqtda ikkita guruh bo'lmasligi uchun
//   TIME overlap tekshiruvi.
// ============================================================

export interface Lesson {
    id: number;
    groupId: number;
    groupName: string;
    courseName: string;
    teacherName: string;
    roomId: number | null;
    roomName: string | null;
    lessonDate: string;
    startTime: string;
    endTime: string;
    topic: string | null;
    homework: string | null;
    status: LessonStatus;
    cancelledReason: string | null;
    createdAt: Date;
}

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';

export interface CreateLessonData {
    groupId: number;
    roomId?: number | null;
    lessonDate: string;    // YYYY-MM-DD
    startTime: string;    // HH:MM
    endTime: string;    // HH:MM
    topic?: string | null;
    homework?: string | null;
}

export interface RoomConflict {
    conflictingLessonId: number;
    conflictingGroup: string;
    conflictingCourse: string;
    date: string;
    startTime: string;
    endTime: string;
}

function mapLesson(r: Record<string, unknown>): Lesson {
    return {
        id: r.id as number,
        groupId: r.group_id as number,
        groupName: r.group_name as string,
        courseName: r.course_name as string,
        teacherName: r.teacher_name as string,
        roomId: r.room_id as number | null,
        roomName: r.room_name as string | null,
        lessonDate: r.lesson_date as string,
        startTime: r.start_time as string,
        endTime: r.end_time as string,
        topic: r.topic as string | null,
        homework: r.homework as string | null,
        status: r.status as LessonStatus,
        cancelledReason: r.cancelled_reason as string | null,
        createdAt: new Date(r.created_at as string),
    };
}

const LESSON_SELECT = `
  SELECT
    l.id,
    l.group_id,
    g.name                              AS group_name,
    c.name                              AS course_name,
    u.first_name || ' ' || u.last_name  AS teacher_name,
    l.room_id,
    r.name                              AS room_name,
    l.lesson_date::TEXT,
    l.start_time::TEXT,
    l.end_time::TEXT,
    l.topic, l.homework, l.status, l.cancelled_reason, l.created_at
  FROM lessons l
  JOIN groups  g  ON g.id = l.group_id
  JOIN courses c  ON c.id = g.course_id
  JOIN teacher_profiles tp ON tp.id = g.teacher_id
  JOIN users u  ON u.id = tp.user_id
  LEFT JOIN rooms r ON r.id = l.room_id
  WHERE l.deleted_at IS NULL
`;

export class LessonRepository {

    // ════════════════════════════════════════════════════════
    // O'QISH
    // ════════════════════════════════════════════════════════

    async findById(id: number): Promise<Lesson | null> {
        const rows = await query<Record<string, unknown>>(
            `${LESSON_SELECT} AND l.id = $1`, [id]
        );
        return rows.length ? mapLesson(rows[0]) : null;
    }

    async findAll(opts: {
        groupId?: number;
        roomId?: number;
        teacherId?: number;
        date?: string;
        fromDate?: string;
        toDate?: string;
        status?: LessonStatus;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Lesson[]; total: number }> {
        const { groupId, roomId, teacherId, date, fromDate, toDate, status, limit = 30, offset = 0 } = opts;

        const cond: string[] = ['l.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (groupId) { cond.push(`l.group_id        = $${i++}`); params.push(groupId); }
        if (roomId) { cond.push(`l.room_id         = $${i++}`); params.push(roomId); }
        if (teacherId) { cond.push(`g.teacher_id      = $${i++}`); params.push(teacherId); }
        if (date) { cond.push(`l.lesson_date     = $${i++}::DATE`); params.push(date); }
        if (fromDate) { cond.push(`l.lesson_date    >= $${i++}::DATE`); params.push(fromDate); }
        if (toDate) { cond.push(`l.lesson_date    <= $${i++}::DATE`); params.push(toDate); }
        if (status) { cond.push(`l.status          = $${i++}`); params.push(status); }

        const where = cond.join(' AND ');

        const [ct] = await query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM lessons l
             JOIN groups g ON g.id = l.group_id
             WHERE ${where}`, params
        );
        const total = parseInt(ct?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `${LESSON_SELECT.replace('WHERE l.deleted_at IS NULL', `WHERE ${where}`)}
             ORDER BY l.lesson_date DESC, l.start_time
             LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapLesson), total };
    }

    // ════════════════════════════════════════════════════════
    // 🚨 ROOM CONFLICT DETECTION
    //
    // Shart: Bir xonada bir sanada vaqt intervallar o'rtatishi:
    //   newStart < existingEnd  AND  newEnd > existingStart
    //
    // Istisno: Yangilanayotgan darsning o'zi (excludeLessonId)
    // ════════════════════════════════════════════════════════

    async checkRoomConflict(opts: {
        roomId: number;
        lessonDate: string;   // YYYY-MM-DD
        startTime: string;   // HH:MM
        endTime: string;   // HH:MM
        excludeLessonId?: number;  // Yangilanayotgan dars ID si (o'zini chiqarib tashlash)
    }): Promise<RoomConflict[]> {

        const { roomId, lessonDate, startTime, endTime, excludeLessonId } = opts;

        const params: unknown[] = [roomId, lessonDate, startTime, endTime];
        let excludeClause = '';
        if (excludeLessonId) {
            params.push(excludeLessonId);
            excludeClause = `AND l.id != $${params.length}`;
        }

        const rows = await query<Record<string, unknown>>(
            `SELECT
               l.id   AS conflicting_lesson_id,
               g.name AS conflicting_group,
               c.name AS conflicting_course,
               l.lesson_date::TEXT AS date,
               l.start_time::TEXT  AS start_time,
               l.end_time::TEXT    AS end_time
             FROM lessons l
             JOIN groups  g ON g.id = l.group_id
             JOIN courses c ON c.id = g.course_id
             WHERE l.room_id    = $1
               AND l.lesson_date = $2::DATE
               AND l.status     != 'cancelled'
               AND l.deleted_at IS NULL
               AND $3::TIME < l.end_time       -- Yangi boshlanishi eski tugashidan oldin
               AND $4::TIME > l.start_time     -- Yangi tugashi eski boshlanishidan keyin
               ${excludeClause}`,
            params
        );

        return rows.map(r => ({
            conflictingLessonId: r.conflicting_lesson_id as number,
            conflictingGroup: r.conflicting_group as string,
            conflictingCourse: r.conflicting_course as string,
            date: r.date as string,
            startTime: r.start_time as string,
            endTime: r.end_time as string,
        }));
    }

    /**
     * O'qituvchi conflict — Bir o'qituvchi bir vaqtda ikkita dars bera olmaydi.
     */
    async checkTeacherConflict(opts: {
        teacherId: number;
        lessonDate: string;
        startTime: string;
        endTime: string;
        excludeLessonId?: number;
    }): Promise<RoomConflict[]> {
        const { teacherId, lessonDate, startTime, endTime, excludeLessonId } = opts;
        const params: unknown[] = [teacherId, lessonDate, startTime, endTime];
        let excludeClause = '';
        if (excludeLessonId) {
            params.push(excludeLessonId);
            excludeClause = `AND l.id != $${params.length}`;
        }

        const rows = await query<Record<string, unknown>>(
            `SELECT
               l.id   AS conflicting_lesson_id,
               g.name AS conflicting_group,
               c.name AS conflicting_course,
               l.lesson_date::TEXT AS date,
               l.start_time::TEXT  AS start_time,
               l.end_time::TEXT    AS end_time
             FROM lessons l
             JOIN groups  g  ON g.id = l.group_id
             JOIN courses c  ON c.id = g.course_id
             WHERE g.teacher_id  = $1
               AND l.lesson_date = $2::DATE
               AND l.status     != 'cancelled'
               AND l.deleted_at IS NULL
               AND $3::TIME < l.end_time
               AND $4::TIME > l.start_time
               ${excludeClause}`,
            params
        );
        return rows.map(r => ({
            conflictingLessonId: r.conflicting_lesson_id as number,
            conflictingGroup: r.conflicting_group as string,
            conflictingCourse: r.conflicting_course as string,
            date: r.date as string,
            startTime: r.start_time as string,
            endTime: r.end_time as string,
        }));
    }

    // ════════════════════════════════════════════════════════
    // YARATISH (Conflict tekshiruvi service'da)
    // ════════════════════════════════════════════════════════

    async create(data: CreateLessonData): Promise<Lesson> {
        const [row] = await query<{ id: number }>(
            `INSERT INTO lessons
               (group_id, room_id, lesson_date, start_time, end_time, topic, homework)
             VALUES ($1,$2,$3::DATE,$4::TIME,$5::TIME,$6,$7)
             RETURNING id`,
            [
                data.groupId,
                data.roomId ?? null,
                data.lessonDate,
                data.startTime,
                data.endTime,
                data.topic ?? null,
                data.homework ?? null,
            ]
        );
        return (await this.findById(row.id))!;
    }

    async update(id: number, data: Partial<CreateLessonData & {
        topic?: string | null;
        homework?: string | null;
    }>): Promise<Lesson | null> {
        const set: string[] = [];
        const params: unknown[] = [];
        let i = 1;

        if (data.roomId !== undefined) { set.push(`room_id     = $${i++}`); params.push(data.roomId ?? null); }
        if (data.lessonDate !== undefined) { set.push(`lesson_date = $${i++}::DATE`); params.push(data.lessonDate); }
        if (data.startTime !== undefined) { set.push(`start_time  = $${i++}::TIME`); params.push(data.startTime); }
        if (data.endTime !== undefined) { set.push(`end_time    = $${i++}::TIME`); params.push(data.endTime); }
        if (data.topic !== undefined) { set.push(`topic       = $${i++}`); params.push(data.topic ?? null); }
        if (data.homework !== undefined) { set.push(`homework    = $${i++}`); params.push(data.homework ?? null); }

        if (!set.length) return this.findById(id);
        params.push(id);
        await query(
            `UPDATE lessons SET ${set.join(', ')} WHERE id = $${i} AND deleted_at IS NULL`,
            params
        );
        return this.findById(id);
    }

    async cancel(id: number, reason: string): Promise<Lesson | null> {
        await query(
            `UPDATE lessons
             SET status = 'cancelled', cancelled_reason = $1
             WHERE id = $2 AND status != 'cancelled' AND deleted_at IS NULL`,
            [reason, id]
        );
        return this.findById(id);
    }

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE lessons SET deleted_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL`, [id]
        );
    }

    // Bugungi jadval (Dashboard widget)
    async getTodaySchedule(teacherId?: number): Promise<Lesson[]> {
        const cond = teacherId
            ? `AND g.teacher_id = ${teacherId}`
            : '';
        const rows = await query<Record<string, unknown>>(
            `${LESSON_SELECT}
              AND l.lesson_date = CURRENT_DATE
              AND l.status = 'scheduled'
              ${cond}
             ORDER BY l.start_time`,
            []
        );
        return rows.map(mapLesson);
    }
}
