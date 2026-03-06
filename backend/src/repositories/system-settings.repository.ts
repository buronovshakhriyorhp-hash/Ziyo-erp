import { query } from '../config/database';

export interface SystemSetting {
    key: string;
    value: string;
    description?: string;
    updatedAt?: Date;
    updatedBy?: number;
}

export class SystemSettingsRepository {
    async getAll(): Promise<SystemSetting[]> {
        return query('SELECT * FROM erp.system_settings ORDER BY key');
    }

    async getByKey(key: string): Promise<SystemSetting | null> {
        const rows = await query<SystemSetting>('SELECT * FROM erp.system_settings WHERE key = $1', [key]);
        return rows[0] || null;
    }

    async update(key: string, value: string, updatedBy?: number): Promise<void> {
        await query(
            `UPDATE erp.system_settings 
             SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE key = $3`,
            [value, updatedBy, key]
        );
    }

    async updateMultiple(settings: Record<string, string>, updatedBy?: number): Promise<void> {
        for (const [key, value] of Object.entries(settings)) {
            await this.update(key, value, updatedBy);
        }
    }
}
