import { query } from '../config/database';

// ============================================================
// COURSE REPOSITORY
// Mas'uliyat: courses va subjects jadvallari bilan muloqot.
// ============================================================

export interface Course {
    id: number;
    subjectId: number;
    subjectName: string;
    name: string;
    description: string | null;
    durationMonths: number;
    lessonsPerWeek: number;
    lessonDurationMin: number;
    pricePerMonth: number;
    level: CourseLevel;
    isActive: boolean;
    activeGroups: number;   // Hozirgi aktiv guruhlar soni
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export type CourseLevel =
    | 'beginner'
    | 'elementary'
    | 'intermediate'
    | 'upper_intermediate'
    | 'advanced';

export interface CreateCourseData {
    subjectId: number;
    name: string;
    description?: string | null;
    durationMonths?: number;
    lessonsPerWeek?: number;
    lessonDurationMin?: number;
    pricePerMonth: number;
    level?: CourseLevel;
}

// ──────────────────────────────────────────────────────────────
// MAPPER
// ──────────────────────────────────────────────────────────────
function mapRow(r: Record<string, unknown>): Course {
    return {
        id: r.id as number,
        subjectId: r.subject_id as number,
        subjectName: r.subject_name as string,
        name: r.name as string,
        description: r.description as string | null,
        durationMonths: r.duration_months as number,
        lessonsPerWeek: r.lessons_per_week as number,
        lessonDurationMin: r.lesson_duration_min as number,
        pricePerMonth: parseFloat(r.price_per_month as string),
        level: r.level as CourseLevel,
        isActive: r.is_active as boolean,
        activeGroups: parseInt(r.active_groups as string ?? '0', 10),
        createdAt: new Date(r.created_at as string),
        updatedAt: new Date(r.updated_at as string),
        deletedAt: r.deleted_at ? new Date(r.deleted_at as string) : null,
    };
}

const BASE_SELECT = `
  SELECT
    c.id,
    c.subject_id,
    s.name          AS subject_name,
    c.name,
    c.description,
    c.duration_months,
    c.lessons_per_week,
    c.lesson_duration_min,
    c.price_per_month,
    c.level,
    c.is_active,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    COUNT(g.id) FILTER (
        WHERE g.status IN ('recruiting','active') AND g.deleted_at IS NULL
    )               AS active_groups
  FROM courses c
  JOIN subjects s ON s.id = c.subject_id
  LEFT JOIN groups g ON g.course_id = c.id
  WHERE c.deleted_at IS NULL
`;
const GROUP_BY = `GROUP BY c.id, s.name`;

// ──────────────────────────────────────────────────────────────
// REPOSITORY
// ──────────────────────────────────────────────────────────────
export class CourseRepository {

    async findById(id: number): Promise<Course | null> {
        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT} AND c.id = $1 ${GROUP_BY}`, [id]
        );
        return rows.length ? mapRow(rows[0]) : null;
    }

    async findAll(options: {
        subjectId?: number;
        isActive?: boolean;
        level?: CourseLevel;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: Course[]; total: number }> {
        const { subjectId, isActive, level, search, limit = 20, offset = 0 } = options;

        const cond: string[] = ['c.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;

        if (subjectId !== undefined) { cond.push(`c.subject_id = $${i++}`); params.push(subjectId); }
        if (isActive !== undefined) { cond.push(`c.is_active  = $${i++}`); params.push(isActive); }
        if (level) { cond.push(`c.level      = $${i++}`); params.push(level); }
        if (search?.trim()) {
            cond.push(`(c.name ILIKE $${i} OR s.name ILIKE $${i})`);
            params.push(`%${search.trim()}%`);
            i++;
        }

        const where = cond.join(' AND ');

        const [countRow] = await query<{ count: string }>(
            `SELECT COUNT(DISTINCT c.id) AS count
             FROM courses c JOIN subjects s ON s.id = c.subject_id
             WHERE ${where}`,
            params
        );
        const total = parseInt(countRow?.count ?? '0', 10);

        const rows = await query<Record<string, unknown>>(
            `${BASE_SELECT.replace('WHERE c.deleted_at IS NULL', `WHERE ${where}`)}
             ${GROUP_BY}
             ORDER BY c.created_at DESC
             LIMIT $${i++} OFFSET $${i}`,
            [...params, limit, offset]
        );
        return { data: rows.map(mapRow), total };
    }

    async create(data: CreateCourseData): Promise<Course> {
        const rows = await query<Record<string, unknown>>(
            `INSERT INTO courses
               (subject_id, name, description, duration_months,
                lessons_per_week, lesson_duration_min, price_per_month, level)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id`,
            [
                data.subjectId,
                data.name,
                data.description ?? null,
                data.durationMonths ?? 1,
                data.lessonsPerWeek ?? 3,
                data.lessonDurationMin ?? 90,
                data.pricePerMonth,
                data.level ?? 'beginner',
            ]
        );
        return (await this.findById(rows[0].id as number))!;
    }

    async update(id: number, data: Partial<CreateCourseData & { isActive: boolean }>): Promise<Course | null> {
        const set: string[] = [];
        const params: unknown[] = [];
        let i = 1;

        const map: Record<string, string> = {
            subjectId: 'subject_id', name: 'name', description: 'description',
            durationMonths: 'duration_months', lessonsPerWeek: 'lessons_per_week',
            lessonDurationMin: 'lesson_duration_min', pricePerMonth: 'price_per_month',
            level: 'level', isActive: 'is_active',
        };

        for (const [k, col] of Object.entries(map)) {
            if (k in data && (data as Record<string, unknown>)[k] !== undefined) {
                set.push(`${col} = $${i++}`);
                params.push((data as Record<string, unknown>)[k]);
            }
        }
        if (!set.length) return this.findById(id);

        params.push(id);
        await query(
            `UPDATE courses SET ${set.join(', ')} WHERE id = $${i} AND deleted_at IS NULL`,
            params
        );
        return this.findById(id);
    }

    async softDelete(id: number): Promise<void> {
        await query(
            `UPDATE courses
             SET deleted_at = NOW(), is_active = FALSE
             WHERE id = $1 AND deleted_at IS NULL`,
            [id]
        );
    }

    // Subjects ro'yxati (kurs yaratishda kerak)
    async listSubjects(): Promise<{ id: number; name: string }[]> {
        return query<{ id: number; name: string }>(
            `SELECT id, name FROM subjects
             WHERE deleted_at IS NULL
             ORDER BY name`
        );
    }
}
