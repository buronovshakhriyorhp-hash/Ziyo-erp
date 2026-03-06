import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { DocumentService } from '../services/document.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { SalaryRepository } from '../repositories/salary.repository';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize, Roles } from '../middlewares/authorize.middleware';

const router = Router();
const paymentRepo = new PaymentRepository();
const salaryRepo = new SalaryRepository();
const documentService = new DocumentService(paymentRepo, salaryRepo);
const documentController = new DocumentController(documentService);

/** To'lov kvitansiyasini yuklab olish */
router.get('/payment-receipt/:id', authenticate, authorize(...Roles.FINANCE_ACCESS), (req, res) =>
    documentController.downloadPaymentReceipt(req, res));

/** Oylik slipini yuklab olish */
router.get('/salary-slip/:id', authenticate, authorize(...Roles.FINANCE_ACCESS), (req, res) =>
    documentController.downloadSalarySlip(req, res));

export default router;
