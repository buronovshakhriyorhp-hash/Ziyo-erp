import PDFDocument from 'pdfkit';
import { PaymentRepository } from '../repositories/payment.repository';
import { SalaryRepository } from '../repositories/salary.repository';
import { AppError } from '../utils/api-response.util';

export class DocumentService {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly salaryRepo: SalaryRepository
    ) { }

    /** Professional To'lov kvitansiyasini yaratish */
    async generatePaymentReceipt(paymentId: number): Promise<Buffer> {
        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) throw new AppError('To\'lov topilmadi', 404);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A5', margin: 30 });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const formatCurrency = (amt: number) =>
                new Intl.NumberFormat('uz-UZ').format(amt) + " UZS";

            // ─── Header ──────────────────────────────────────────
            doc.fillColor('#2563EB').fontSize(20).font('Helvetica-Bold')
                .text('ZIYO CHASHMASI', { align: 'center' });
            doc.fillColor('#4B5563').fontSize(10).font('Helvetica')
                .text('O\'quv Markazi ERP Tizimi', { align: 'center' });
            doc.moveDown(1);

            doc.strokeColor('#E5E7EB').lineWidth(1)
                .moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
            doc.moveDown(1.5);

            // ─── Title ───────────────────────────────────────────
            doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold')
                .text(`TO'LOV KVITANSIYASI № ${payment.id}`, { align: 'center' });
            doc.moveDown(1);

            // ─── Details ─────────────────────────────────────────
            const startY = doc.y;
            const leftCol = 100;
            const rightCol = 30;

            const drawRow = (label: string, value: string) => {
                doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text(label, rightCol, doc.y, { continued: true });
                doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(value, leftCol, doc.y);
                doc.moveDown(0.8);
            };

            drawRow('Talaba:', payment.studentName);
            drawRow('Guruh:', payment.groupName);
            drawRow('Kurs:', payment.courseName);
            drawRow('Sana:', new Date(payment.paymentDate).toLocaleDateString('uz-UZ'));
            drawRow('O\'y:', payment.paymentMonth.slice(0, 7)); // YYYY-MM
            drawRow('Turi:', payment.paymentMethod);

            doc.moveDown(1);
            doc.rect(25, doc.y, doc.page.width - 50, 40).fillColor('#F9FAFB').fill();
            doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold')
                .text('TO\'LANGAN SUMMA:', 40, doc.y + 14, { continued: true })
                .fillColor('#059669').fontSize(14).text(`  ${formatCurrency(payment.amount)}`, 160, doc.y + 12);

            doc.moveDown(3);

            // ─── Footer ───────────────────────────────────────────
            doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
                .text('Qabul qildi: ' + payment.receivedByName, { align: 'left', continued: true })
                .text('Sana: ' + new Date().toLocaleString('uz-UZ'), { align: 'right' });

            doc.moveDown(0.5);
            doc.text('Ushbu hujjat elektron tarzda yaratilgan va imzosiz haqiqiydir.', { align: 'center', oblique: true });

            doc.end();
        });
    }

    /** Professional O'qituvchi oylik kvitansiyasini yaratish */
    async generateSalarySlip(payoutId: number): Promise<Buffer> {
        const sal = await this.salaryRepo.findById(payoutId);
        if (!sal) throw new AppError('Oylik hisoboti topilmadi', 404);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const formatCurrency = (amt: number) =>
                new Intl.NumberFormat('uz-UZ').format(amt) + " UZS";

            // ─── Header ──────────────────────────────────────────
            doc.fillColor('#2563EB').fontSize(24).font('Helvetica-Bold')
                .text('ZIYO CHASHMASI', { align: 'left' });
            doc.fillColor('#4B5563').fontSize(12).font('Helvetica')
                .text('Xodimlar Ish Haqi Kvitansiyasi', { align: 'left' });

            doc.moveUp(2);
            doc.fillColor('#9CA3AF').fontSize(10)
                .text(new Date().toLocaleDateString('uz-UZ'), { align: 'right' });
            doc.moveDown(2.5);

            doc.strokeColor('#E5E7EB').lineWidth(1)
                .moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
            doc.moveDown(2);

            // ─── Info Grid ───────────────────────────────────────
            doc.fillColor('#111827').fontSize(16).font('Helvetica-Bold')
                .text(sal.teacherName, { align: 'left' });
            doc.fillColor('#6B7280').fontSize(11).font('Helvetica')
                .text(sal.specialization || 'O\'qituvchi', { align: 'left' });
            doc.moveDown(1);

            doc.fillColor('#374151').fontSize(12).font('Helvetica-Bold')
                .text(`Hisobot oyi: ${sal.periodMonth.slice(0, 7)}`, { align: 'left' });
            doc.moveDown(2);

            // ─── Table Header ────────────────────────────────────
            const tableY = doc.y;
            doc.rect(40, tableY, doc.page.width - 80, 25).fillColor('#F3F4F6').fill();
            doc.fillColor('#4B5563').fontSize(10).font('Helvetica-Bold');
            doc.text('TASNIF', 50, tableY + 8);
            doc.text('KO\'RSATKICH', 250, tableY + 8);
            doc.text('SUMMA', 450, tableY + 8);

            // ─── Rows ────────────────────────────────────────────
            let y = tableY + 25;
            const drawRow = (label: string, detail: string, amount: number, isTotal = false) => {
                if (isTotal) {
                    doc.rect(40, y, doc.page.width - 80, 30).fillColor('#EEF2FF').fill();
                    doc.fillColor('#1E40AF').font('Helvetica-Bold').fontSize(12);
                } else {
                    doc.fillColor('#374151').font('Helvetica').fontSize(10);
                }

                doc.text(label, 50, y + 8);
                doc.text(detail, 250, y + 8);
                doc.text(formatCurrency(amount), 450, y + 8, { width: 100, align: 'right' });
                y += isTotal ? 35 : 25;
            };

            drawRow('Asosiy ish haqi (Base)', 'Belgilangan', sal.baseSalary);
            drawRow('KPI Bonus', `${sal.attendanceRate}% davomat`, sal.kpiBonus);
            drawRow('Jarima / Chegiruv', sal.notes || 'Yo\'q', -sal.deductions);

            y += 5;
            drawRow('JAMI TO\'LANADIGAN:', '', sal.totalSalary, true);

            // ─── Stats ───────────────────────────────────────────
            y += 20;
            doc.fillColor('#6B7280').fontSize(10).font('Helvetica-Bold').text('O\'tilgan darslar:', 50, y);
            doc.font('Helvetica').text(`${sal.totalLessonsConducted} / ${sal.totalLessonsPlanned}`, 150, y);

            // ─── Signature ───────────────────────────────────────
            doc.moveDown(6);
            const sigY = doc.y;
            doc.strokeColor('#D1D5DB').lineWidth(0.5)
                .moveTo(50, sigY).lineTo(200, sigY).stroke();
            doc.moveTo(350, sigY).lineTo(500, sigY).stroke();

            doc.fillColor('#9CA3AF').fontSize(9)
                .text('Admin imzosi', 50, sigY + 5, { width: 150, align: 'center' })
                .text('O\'qituvchi imzosi', 350, sigY + 5, { width: 150, align: 'center' });

            doc.end();
        });
    }
}
