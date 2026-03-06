import { SystemSettingsRepository, SystemSetting } from '../repositories/system-settings.repository';
import { AppError } from '../utils/api-response.util';

export class SystemSettingsService {
    constructor(private readonly settingsRepo: SystemSettingsRepository) { }

    async getAll(): Promise<SystemSetting[]> {
        return this.settingsRepo.getAll();
    }

    async updateSettings(settings: Record<string, string>, updatedBy: number): Promise<void> {
        // Validate keys (optional but good for security)
        const allowedKeys = ['telegram_bot_token', 'telegram_chat_id', 'company_name', 'company_phone', 'payme_merchant_id', 'click_service_id', 'click_merchant_user_id'];
        for (const key of Object.keys(settings)) {
            if (!allowedKeys.includes(key)) {
                throw new AppError(`Noma'lum sozlama: ${key}`, 400);
            }
        }

        await this.settingsRepo.updateMultiple(settings, updatedBy);
    }
}
