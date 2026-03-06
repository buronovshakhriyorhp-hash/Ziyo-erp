import { Request, Response } from 'express';
import { SystemSettingsService } from '../services/system-settings.service';
import { sendSuccess } from '../utils/api-response.util';

export class SystemSettingsController {
    constructor(private readonly settingsService: SystemSettingsService) { }

    async getSettings(req: Request, res: Response) {
        const settings = await this.settingsService.getAll();
        return sendSuccess(res, settings);
    }

    async updateSettings(req: Request, res: Response) {
        const { settings } = req.body;
        const userId = (req as any).user.sub;

        await this.settingsService.updateSettings(settings, userId);
        return sendSuccess(res, null, 'Sozlamalar yangilandi');
    }

    async getPaymentConfig(req: Request, res: Response) {
        const settings = await this.settingsService.getAll();

        // Faqat kerakli (maxfiy bo'lmagan) kalitlarni qaytarish
        const config = {
            payme_merchant_id: settings.find(s => s.key === 'payme_merchant_id')?.value || '',
            click_service_id: settings.find(s => s.key === 'click_service_id')?.value || '',
            click_merchant_user_id: settings.find(s => s.key === 'click_merchant_user_id')?.value || '',
        };

        return sendSuccess(res, config);
    }
}
