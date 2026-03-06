import { query } from '../config/database';
import { logger } from '../utils/logger.util';

// ============================================================
// AI CHURN DETECTION SERVICE
// Talaba tark etish ehtimolini hisoblash (Rule-based ML model)
// ============================================================

interface ChurnFactor {
    factor: string;
    weight: number;
    value: number;
    score: number;
}

interface StudentChurnResult {
    studentId: number;
    studentName: string;
    groupName: string;
    churnProbability: number;   // 0-100%
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: ChurnFactor[];
    recommendation: string;
}

export class ChurnDetectionService {

    /** Guruh bo'yicha risk tahlili */
    async analyzeGroup(groupId: number): Promise<StudentChurnResult[]> {
        const enrollments = await query<any>(`
            SELECT 
                e.id as enrollment_id,
                e.student_id,
                e.status,
                s.full_name as student_name,
                g.name as group_name,
                g.id as group_id,
                -- Davomat statistikasi (oxirgi 30 kun)
                COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'absent' AND al.created_at > NOW() - INTERVAL '30 days') as absent_count,
                COUNT(DISTINCT al.id) FILTER (WHERE al.created_at > NOW() - INTERVAL '30 days') as total_lessons,
                -- To'lov holati
                COALESCE(SUM(pd.amount_due - pd.amount_paid) FILTER (WHERE pd.status IN ('pending','overdue')), 0) as unpaid_debt,
                COUNT(*) FILTER (WHERE pd.status = 'overdue') as overdue_debts,
                -- So'nggi faollik
                MAX(al.created_at) as last_lesson_date
            FROM enrollments e
            JOIN students s ON s.id = e.student_id
            JOIN groups g ON g.id = e.group_id
            LEFT JOIN attendance_logs al ON al.enrollment_id = e.id
            LEFT JOIN payment_debts pd ON pd.enrollment_id = e.id
            WHERE e.group_id = $1 AND e.status = 'active'
            GROUP BY e.id, e.student_id, e.status, s.full_name, g.name, g.id
            ORDER BY student_name
        `, [groupId]);

        return enrollments.map((row: any) => this.calculateChurnScore(row));
    }

    /** Butun markaz bo'yicha yuqori risk talabalar */
    async getHighRiskStudents(limit: number = 20): Promise<StudentChurnResult[]> {
        const result = await query<any>(`
            SELECT 
                e.id as enrollment_id,
                e.student_id,
                s.full_name as student_name,
                g.name as group_name,
                g.id as group_id,
                COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'absent' AND al.created_at > NOW() - INTERVAL '30 days') as absent_count,
                COUNT(DISTINCT al.id) FILTER (WHERE al.created_at > NOW() - INTERVAL '30 days') as total_lessons,
                COALESCE(SUM(pd.amount_due - pd.amount_paid) FILTER (WHERE pd.status IN ('pending','overdue')), 0) as unpaid_debt,
                COUNT(*) FILTER (WHERE pd.status = 'overdue') as overdue_debts,
                MAX(al.created_at) as last_lesson_date
            FROM enrollments e
            JOIN students s ON s.id = e.student_id
            JOIN groups g ON g.id = e.group_id
            LEFT JOIN attendance_logs al ON al.enrollment_id = e.id
            LEFT JOIN payment_debts pd ON pd.enrollment_id = e.id
            WHERE e.status = 'active'
            GROUP BY e.id, e.student_id, s.full_name, g.name, g.id
            ORDER BY absent_count DESC, unpaid_debt DESC
            LIMIT $1
        `, [limit]);

        return result
            .map((row: any) => this.calculateChurnScore(row))
            .filter((r: any) => r.riskLevel !== 'low')
            .sort((a: any, b: any) => b.churnProbability - a.churnProbability);
    }

    /** Umumiy churn statistikasi */
    async getSummaryStats(): Promise<{
        total: number;
        low: number;
        medium: number;
        high: number;
        critical: number;
        avgChurnRate: number;
    }> {
        try {
            const results = await this.getHighRiskStudents(500);
            return {
                total: results.length,
                low: results.filter(r => r.riskLevel === 'low').length,
                medium: results.filter(r => r.riskLevel === 'medium').length,
                high: results.filter(r => r.riskLevel === 'high').length,
                critical: results.filter(r => r.riskLevel === 'critical').length,
                avgChurnRate: results.length
                    ? results.reduce((acc, r) => acc + r.churnProbability, 0) / results.length
                    : 0,
            };
        } catch (err) {
            logger.error('Churn stats xatosi:', err);
            return { total: 0, low: 0, medium: 0, high: 0, critical: 0, avgChurnRate: 0 };
        }
    }

    /** Churn ehtimolini hisoblash (rule-based scoring) */
    private calculateChurnScore(row: any): StudentChurnResult {
        const factors: ChurnFactor[] = [];

        // 1. DAVOMAT DARAJASI (40% og'irlik)
        const attendanceRate = row.total_lessons > 0
            ? 1 - (row.absent_count / row.total_lessons)
            : 1;

        const attendanceScore = Math.max(0, (1 - attendanceRate) * 40);
        factors.push({
            factor: 'Davomat darajasi',
            weight: 40,
            value: Math.round(attendanceRate * 100),
            score: Math.round(attendanceScore)
        });

        // 2. TO'LOV HOLATI (35% og'irlik)
        const debtScore = Math.min(35,
            (row.overdue_debts * 15) +
            (row.unpaid_debt > 500_000 ? 15 : row.unpaid_debt > 200_000 ? 8 : row.unpaid_debt > 0 ? 3 : 0)
        );
        factors.push({
            factor: 'To\'lov holati',
            weight: 35,
            value: row.unpaid_debt,
            score: Math.round(debtScore)
        });

        // 3. FAOLSIZLIK DAVRI (25% og'irlik)
        let inactivityScore = 0;
        if (row.last_lesson_date) {
            const daysSinceLast = Math.floor(
                (Date.now() - new Date(row.last_lesson_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            inactivityScore = Math.min(25, daysSinceLast * 0.8);
        } else {
            inactivityScore = 25; // Hech qachon darsga kelmagan
        }

        factors.push({
            factor: 'Faolsizlik davri',
            weight: 25,
            value: row.last_lesson_date
                ? Math.floor((Date.now() - new Date(row.last_lesson_date).getTime()) / 86400000)
                : 999,
            score: Math.round(inactivityScore)
        });

        const totalScore = Math.min(100, factors.reduce((acc, f) => acc + f.score, 0));

        const riskLevel: StudentChurnResult['riskLevel'] =
            totalScore >= 70 ? 'critical' :
                totalScore >= 50 ? 'high' :
                    totalScore >= 25 ? 'medium' : 'low';

        const recommendation =
            riskLevel === 'critical' ? '🚨 Darhol bog\'laning! Talaba ketish xavfi juda yuqori.' :
                riskLevel === 'high' ? '⚠️ Bu hafta muloqot o\'tkazing va to\'lov rejasini muhokama qiling.' :
                    riskLevel === 'medium' ? '📞 To\'lovni eslatib qo\'ying va davomat ko\'rsatkichini oshiring.' :
                        '✅ Talaba holati yaxshi. Muntazam kuzatib boring.';

        return {
            studentId: row.student_id,
            studentName: row.student_name,
            groupName: row.group_name,
            churnProbability: totalScore,
            riskLevel,
            factors,
            recommendation,
        };
    }
}

export const churnDetectionService = new ChurnDetectionService();
