import { Router } from 'express';
import { SystemSettingsController } from '../controllers/system-settings.controller';
import { SystemSettingsService } from '../services/system-settings.service';
import { SystemSettingsRepository } from '../repositories/system-settings.repository';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';

const router = Router();
const settingsRepo = new SystemSettingsRepository();
const settingsService = new SystemSettingsService(settingsRepo);
const settingsController = new SystemSettingsController(settingsService);

// Faqat Adminlar sozlamalarni ko'rishi va o'zgartirishi mumkin
router.get('/', authenticate, authorize(...Roles.ADMIN_ONLY), (req, res) => settingsController.getSettings(req, res));
router.patch('/', authenticate, authorize(...Roles.ADMIN_ONLY), (req, res) => settingsController.updateSettings(req, res));

// Barcha obunachilar (talaba, ota-ona) tolov integratsiyalari identifikatorlarini o'qishi mumkin
router.get('/payment-config', authenticate, (req, res) => settingsController.getPaymentConfig(req, res));

export default router;
