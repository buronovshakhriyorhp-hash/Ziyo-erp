import { query } from '../config/database';

export interface SearchResult {
    type: 'student' | 'lead' | 'teacher' | 'group' | 'course';
    id: number;
    title: string;
    subtitle: string;
    url: string;
}

export class SearchRepository {
    async globalSearch(q: string): Promise<SearchResult[]> {
        const searchTerm = `%${q}%`;
        const results: SearchResult[] = [];

        // 1. Students
        const students = await query<{ id: number, title: string, subtitle: string }>(`
            SELECT id, first_name || ' ' || last_name as title, phone as subtitle 
            FROM users 
            WHERE role_id = (SELECT id FROM roles WHERE name='student') 
              AND deleted_at IS NULL 
              AND (first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1)
            LIMIT 5
        `, [searchTerm]);

        // 2. Leads
        const leads = await query<{ id: number, title: string, subtitle: string }>(`
            SELECT id, full_name as title, phone as subtitle
            FROM leads
            WHERE deleted_at IS NULL AND (full_name ILIKE $1 OR phone ILIKE $1)
            LIMIT 5
        `, [searchTerm]);

        // 3. Teachers
        const teachers = await query<{ id: number, title: string, subtitle: string }>(`
            SELECT tp.id, u.first_name || ' ' || u.last_name as title, tp.specialization as subtitle
            FROM teacher_profiles tp
            JOIN users u ON u.id = tp.user_id
            WHERE tp.deleted_at IS NULL AND u.deleted_at IS NULL 
              AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.phone ILIKE $1)
            LIMIT 5
        `, [searchTerm]);

        // 4. Groups
        const groups = await query<{ id: number, title: string, subtitle: string }>(`
            SELECT id, name as title, status as subtitle
            FROM groups
            WHERE deleted_at IS NULL AND name ILIKE $1
            LIMIT 5
        `, [searchTerm]);

        students.forEach(r => results.push({ type: 'student', id: r.id, title: r.title, subtitle: r.subtitle || '', url: `/users/students/${r.id}` }));
        leads.forEach(r => results.push({ type: 'lead', id: r.id, title: r.title, subtitle: r.subtitle || '', url: `/crm/leads/${r.id}` }));
        teachers.forEach(r => results.push({ type: 'teacher', id: r.id, title: r.title, subtitle: r.subtitle || '', url: `/users/teachers/${r.id}` }));
        groups.forEach(r => results.push({ type: 'group', id: r.id, title: r.title, subtitle: r.subtitle || '', url: `/academic/groups/${r.id}` }));

        return results;
    }
}
