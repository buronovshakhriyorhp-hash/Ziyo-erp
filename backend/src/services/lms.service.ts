import { pool } from '../config/database';

export interface CourseMaterial {
    id: number;
    courseId: number;
    title: string;
    description: string | null;
    type: 'video' | 'pdf' | 'assignment';
    contentUrl: string;
    orderIndex: number;
}

export interface GamificationProfile {
    studentId: number;
    xp: number;
    level: number;
    badges: any[];
}

export interface Submission {
    id: number;
    materialId: number;
    studentId: number;
    contentUrl: string;
    status: 'pending' | 'graded' | 'rejected';
    aiFeedback: string | null;
    earnedXp: number;
}

export interface GroupTask {
    id: number;
    groupId: number;
    teacherId: number;
    title: string;
    description: string;
    taskType: 'homework' | 'gamified';
    xpReward: number;
    deadline: string;
    maxScore: number;
    createdAt?: string;
}

export class LmsService {
    // === DDL INIT ===
    static async ensureTablesExist() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS erp.group_tasks (
                id SERIAL PRIMARY KEY,
                group_id INTEGER REFERENCES erp.groups(id) ON DELETE CASCADE,
                teacher_id INTEGER REFERENCES erp.users(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                task_type VARCHAR(50) DEFAULT 'homework',
                xp_reward INTEGER DEFAULT 50,
                max_score INTEGER DEFAULT 100,
                deadline DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Adding column in case table exists
            ALTER TABLE erp.group_tasks ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;

            CREATE TABLE IF NOT EXISTS erp.task_submissions (
                id SERIAL PRIMARY KEY,
                task_id INTEGER REFERENCES erp.group_tasks(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES erp.users(id) ON DELETE CASCADE,
                content_url TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                ai_feedback TEXT,
                earned_xp INTEGER DEFAULT 0,
                graded_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    // Talabaga ruxsat etilgan kurs materiallarini olish
    static async getCourseMaterials(courseId: number, studentId: number): Promise<CourseMaterial[]> {
        // RBAC checking: check if student is enrolled in a group of this course
        const checkEnrollment = await pool.query(`
            SELECT 1 FROM erp.group_enrollments ge
            JOIN erp.groups g ON ge.group_id = g.id
            WHERE ge.student_id = $1 AND g.course_id = $2
            AND ge.status = 'active'
        `, [studentId, courseId]);

        if (checkEnrollment.rowCount === 0) {
            throw new Error('NOT_ENROLLED');
        }

        const res = await pool.query(`
            SELECT id, course_id as "courseId", title, description, type, content_url as "contentUrl", order_index as "orderIndex"
            FROM erp.course_materials
            WHERE course_id = $1
            ORDER BY order_index ASC
        `, [courseId]);

        return res.rows;
    }

    // Gamification profilini olish
    static async getGamificationProfile(studentId: number): Promise<GamificationProfile> {
        // Profilni tekshirish yoki yaratish
        let profile = await pool.query(
            'SELECT xp, level FROM erp.student_gamification WHERE student_id = $1',
            [studentId]
        );

        if (profile.rowCount === 0) {
            await pool.query(
                'INSERT INTO erp.student_gamification (student_id, xp, level) VALUES ($1, 0, 1)',
                [studentId]
            );
            profile = await pool.query(
                'SELECT xp, level FROM erp.student_gamification WHERE student_id = $1',
                [studentId]
            );
        }

        const badges = await pool.query(`
            SELECT b.name, b.description, b.icon_url as "iconUrl"
            FROM erp.student_badges sb
            JOIN erp.badges b ON sb.badge_id = b.id
            WHERE sb.student_id = $1
        `, [studentId]);

        return {
            studentId,
            xp: profile.rows[0].xp,
            level: profile.rows[0].level,
            badges: badges.rows
        };
    }

    // Peshqadamlar ro'yxatini olish
    static async getLeaderboard(limit = 10) {
        const res = await pool.query(`
            SELECT u.id, u.first_name || ' ' || u.last_name as "fullName", sg.xp, sg.level
            FROM erp.student_gamification sg
            JOIN erp.users u ON sg.student_id = u.id
            WHERE u.is_active = true
            ORDER BY sg.xp DESC
            LIMIT $1
        `, [limit]);

        return res.rows;
    }

    // ZiyoBot orqali uy vazifani tekshirish (Mock AI)
    static async submitAssignment(materialId: number, studentId: number, contentUrl: string): Promise<Submission> {
        // Avval pending qilib saqlaymiz
        const res = await pool.query(`
            INSERT INTO erp.submissions (material_id, student_id, content_url, status)
            VALUES ($1, $2, $3, 'pending')
            RETURNING id, material_id as "materialId", student_id as "studentId", content_url as "contentUrl", status, ai_feedback as "aiFeedback", earned_xp as "earnedXp"
        `, [materialId, studentId, contentUrl]);

        const submission = res.rows[0];

        // Fake AI grading delay
        return new Promise((resolve) => {
            setTimeout(async () => {
                const isPassed = Math.random() > 0.2; // 80% ehtimollik bilan o'tadi
                const xp = isPassed ? Math.floor(Math.random() * 50) + 50 : 0; // 50-100 XP
                const feedback = isPassed
                    ? "ZiyoBot: Vazifa a'lo darajada bajarilgan! Kodlash standartlariga amal qilingan. + " + xp + " XP!"
                    : "ZiyoBot: Syntax Error: Ba'zi joylarda mantiqiy xatolar mavjud yoki o'zgaruvchilar to'g'ri e'lon qilinmagan. Qayta urinib ko'ring.";
                const status = isPassed ? 'graded' : 'rejected';

                // Update submission
                await pool.query(`
                    UPDATE erp.submissions
                    SET status = $1, ai_feedback = $2, earned_xp = $3, graded_at = CURRENT_TIMESTAMP
                    WHERE id = $4
                `, [status, feedback, xp, submission.id]);

                // Xp qo'shish
                if (isPassed && xp > 0) {
                    await LmsService.addXp(studentId, xp);
                }

                submission.status = status;
                submission.aiFeedback = feedback;
                submission.earnedXp = xp;

                // Badgelarni tekshirish (ixtiyoriy)
                resolve(submission);
            }, 2500); // 2.5 sekund kutish
        });
    }

    // Talabaga XP qo'shish va Level up qilish
    static async addXp(studentId: number, amount: number) {
        // level = math.floor(sqrt(xp) / 10) + 1 kabi logika (masalan har 100 xp da 1 level)
        await pool.query(`
            UPDATE erp.student_gamification
            SET xp = xp + $2,
                level = FLOOR(SQRT(xp + $2) / 10) + 1
            WHERE student_id = $1
        `, [studentId, amount]);
    }

    // O'qituvchi guruh uchun vazifa yaratishi
    static async createGroupTask(data: Partial<GroupTask>): Promise<GroupTask> {
        await this.ensureTablesExist();
        const res = await pool.query(`
            INSERT INTO erp.group_tasks (group_id, teacher_id, title, description, task_type, xp_reward, max_score, deadline)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [data.groupId, data.teacherId, data.title, data.description, data.taskType || 'homework', data.xpReward || 50, data.maxScore || 100, data.deadline]);
        return res.rows[0];
    }

    // O'qituvchi guruh vazifalarini ko'rishi
    static async getGroupTasks(groupId: number): Promise<any[]> {
        await this.ensureTablesExist();
        const res = await pool.query(`
            SELECT t.*,
                (SELECT COUNT(id) FROM erp.task_submissions WHERE task_id = t.id) as count_submissions
            FROM erp.group_tasks t
            WHERE t.group_id = $1
            ORDER BY t.created_at DESC
        `, [groupId]);
        return res.rows;
    }

    // O'quvchi o'z vazifalarini va topshiriqlarini ko'rishi
    static async getStudentTasks(studentId: number): Promise<any[]> {
        await this.ensureTablesExist();
        const res = await pool.query(`
            SELECT t.*, s.status as submission_status, s.ai_feedback, s.earned_xp, s.content_url as submitted_url
            FROM erp.group_tasks t
            JOIN erp.group_enrollments ge ON t.group_id = ge.group_id
            LEFT JOIN erp.task_submissions s ON s.task_id = t.id AND s.student_id = $1
            WHERE ge.student_id = $1 AND ge.status = 'active'
            ORDER BY t.deadline ASC
        `, [studentId]);
        return res.rows;
    }

    // O'quvchi vazifa topshirishi
    static async submitGroupTask(taskId: number, studentId: number, contentUrl: string): Promise<any> {
        await this.ensureTablesExist();
        const res = await pool.query(`
            INSERT INTO erp.task_submissions (task_id, student_id, content_url, status)
            VALUES ($1, $2, $3, 'pending')
            ON CONFLICT (id) DO UPDATE SET content_url = $3, status = 'pending'
            RETURNING *
        `, [taskId, studentId, contentUrl]);
        return res.rows[0];
    }

    // O'qituvchi vazifani baholashi
    static async gradeTask(submissionId: number, points: number, feedback: string): Promise<void> {
        await this.ensureTablesExist();
        const res = await pool.query(`
            UPDATE erp.task_submissions
            SET status = 'graded', earned_xp = $1, ai_feedback = $2, graded_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING student_id, earned_xp
        `, [points, feedback, submissionId]);

        if (res.rowCount && res.rowCount > 0 && points > 0) {
            const row = res.rows[0];
            await LmsService.addXp(row.student_id, row.earned_xp);
        }
    }
}
