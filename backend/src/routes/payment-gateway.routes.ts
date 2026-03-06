import express from 'express';
import { paymeController } from '../controllers/payme.controller';
import { clickController } from '../controllers/click.controller';

const router = express.Router();

// ── Payme Webhook ─────────────────────────────────────────────
// Payme ushbu endpoint'ga POST so'rov yuboradi
// Auth: Basic Paycom:<PAYME_SECRET_KEY>
router.post('/payme/webhook', paymeController.handle);

// ── Click Webhook ─────────────────────────────────────────────
// Click ushbu 2 ta endpoint'ga POST so'rov yuboradi
router.post('/click/prepare', clickController.prepare);
router.post('/click/complete', clickController.complete);

export default router;
