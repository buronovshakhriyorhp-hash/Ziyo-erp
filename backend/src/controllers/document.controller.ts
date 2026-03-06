import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service';

export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }

    async downloadPaymentReceipt(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID noto\'g\'ri' });

        const pdfBuffer = await this.documentService.generatePaymentReceipt(id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=kvitansiya_${id}.pdf`);
        return res.send(pdfBuffer);
    }

    async downloadSalarySlip(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID noto\'g\'ri' });

        const pdfBuffer = await this.documentService.generateSalarySlip(id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=oylik_slip_${id}.pdf`);
        return res.send(pdfBuffer);
    }
}
