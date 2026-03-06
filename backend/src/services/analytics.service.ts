import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import {
    AnalyticsRepository,
    FinancialSummary,
    StudentStats,
} from '../repositories/analytics.repository';
import { AppError } from '../utils/api-response.util';

// ============================================================
// ANALYTICS SERVICE
//
//  1. Financial Summary  — oylik P&L hisoboti
//  2. Student Stats      — churn rate, davomat
//  3. Teacher Performance
//  4. Monthly Trends
//  5. Export: Excel (.xlsx) va PDF
// ============================================================

function formatAmount(n: number): string {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + " so'm";
}

function parseYearMonth(yearMonth: string): string {
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        throw new AppError(
            'yearMonth formati: YYYY-MM (masalan: 2026-03)',
            400, 'INVALID_YEAR_MONTH'
        );
    }
    return yearMonth;
}

export class AnalyticsService {
    constructor(private readonly repo: AnalyticsRepository) { }

    // ════════════════════════════════════════════════════════
    // FINANCIAL SUMMARY
    // ════════════════════════════════════════════════════════

    async getFinancialSummary(yearMonth: string): Promise<FinancialSummary> {
        parseYearMonth(yearMonth);
        return this.repo.getFinancialSummary(yearMonth);
    }

    // ════════════════════════════════════════════════════════
    // STUDENT STATS (Churn Rate, Attendance)
    // ════════════════════════════════════════════════════════

    async getStudentStats(courseId?: number): Promise<StudentStats[]> {
        return this.repo.getStudentStats(courseId);
    }

    // ════════════════════════════════════════════════════════
    // TEACHER PERFORMANCE
    // ════════════════════════════════════════════════════════

    async getTeacherPerformance(yearMonth: string) {
        parseYearMonth(yearMonth);
        return this.repo.getTeacherPerformance(yearMonth);
    }

    // ════════════════════════════════════════════════════════
    // MONTHLY TRENDS
    // ════════════════════════════════════════════════════════

    async getMonthlyTrends(months: number = 6) {
        if (months < 1 || months > 24) {
            throw new AppError('months 1–24 oralig\'ida bo\'lishi kerak', 400, 'INVALID_MONTHS');
        }
        return this.repo.getMonthlyTrends(months);
    }

    // ════════════════════════════════════════════════════════
    // EXPORT: QARZDORLAR — EXCEL
    //
    //  → Buffer qaytaradi (res.send() bilan jo'natiladi)
    // ════════════════════════════════════════════════════════

    async exportDebtorsToExcel(minDebt: number = 0): Promise<Buffer> {
        const debtors = await this.repo.getAllDebtors(minDebt);

        const wb = new ExcelJS.Workbook();
        wb.creator = 'Ziyo Chashmasi ERP';
        wb.created = new Date();

        const ws = wb.addWorksheet('Qarzdorlar', {
            views: [{ state: 'frozen', ySplit: 1 }],
            pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' },
        });

        // ─── Ustunlar ──────────────────────────────────────────
        ws.columns = [
            { header: '№', key: 'no', width: 5, style: { alignment: { horizontal: 'center' } } },
            { header: 'Talaba ismi', key: 'name', width: 25 },
            { header: 'Telefon', key: 'phone', width: 18 },
            { header: 'Guruhlar', key: 'groups', width: 35 },
            { header: 'Jami qarz', key: 'debt', width: 18, style: { numFmt: '#,##0' } },
            { header: 'Muddati o\'tgan (oy)', key: 'overdue', width: 20, style: { alignment: { horizontal: 'center' } } },
            { header: 'Eng eski qarz', key: 'oldest', width: 18 },
            { header: 'Oxirgi to\'lov', key: 'lastPay', width: 18 },
        ];

        // ─── Sarlavha uslubi ───────────────────────────────────
        ws.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        ws.getRow(1).height = 28;

        // ─── Ma'lumot qatorlari ───────────────────────────────
        debtors.forEach((d, idx) => {
            const isOdd = idx % 2 === 0;
            const row = ws.addRow({
                no: idx + 1,
                name: d.studentName,
                phone: d.phone,
                groups: (d.groups || []).join(', '),
                debt: Number(d.totalDebt),
                overdue: d.overdueMonths,
                oldest: d.oldestDebtDate ?? '-',
                lastPay: d.lastPaymentDate ?? 'Hali to\'lanmagan',
            });
            row.height = 22;

            // Alternating row colors
            row.eachCell(cell => {
                cell.fill = {
                    type: 'pattern', pattern: 'solid',
                    fgColor: { argb: isOdd ? 'FFF0F4FF' : 'FFFFFFFF' },
                };
            });

            // Katta qarz → qizil rang
            if (Number(d.totalDebt) > 500_000) {
                row.getCell('debt').font = { bold: true, color: { argb: 'FFDC2626' } };
            } else if (Number(d.totalDebt) > 200_000) {
                row.getCell('debt').font = { bold: true, color: { argb: 'FFD97706' } };
            }

            // Muddati o'tgan → sariq
            if (Number(d.overdueMonths) > 0) {
                row.getCell('overdue').fill = {
                    type: 'pattern', pattern: 'solid',
                    fgColor: { argb: 'FFFEF08A' },
                };
            }
        });

        // ─── Jami qator ────────────────────────────────────────
        const totalDebt = debtors.reduce((s, d) => s + Number(d.totalDebt), 0);
        const sumRow = ws.addRow({
            no: '', name: 'JAMI', phone: '', groups: '',
            debt: totalDebt, overdue: '', oldest: '', lastPay: '',
        });
        sumRow.height = 24;
        sumRow.eachCell(cell => {
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        });

        return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
    }

    // ════════════════════════════════════════════════════════
    // EXPORT: OYLIK HISOBOT — EXCEL
    // ════════════════════════════════════════════════════════

    async exportMonthlyReportToExcel(yearMonth: string): Promise<Buffer> {
        parseYearMonth(yearMonth);

        const [summary, payments] = await Promise.all([
            this.repo.getFinancialSummary(yearMonth),
            this.repo.getMonthlyPaymentReport(yearMonth),
        ]);

        const wb = new ExcelJS.Workbook();
        wb.creator = 'Ziyo Chashmasi ERP';

        // ─── 1-varaq: Moliyaviy xulosa ─────────────────────────
        const summaryWs = wb.addWorksheet('Moliyaviy Xulosa');
        summaryWs.getColumn(1).width = 35;
        summaryWs.getColumn(2).width = 22;

        const addSummaryRow = (label: string, value: string, bold = false, bgColor?: string) => {
            const r = summaryWs.addRow([label, value]);
            r.getCell(1).font = { bold };
            r.getCell(2).font = { bold };
            r.getCell(2).alignment = { horizontal: 'right' };
            if (bgColor) {
                r.eachCell(c => {
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                });
            }
        };

        summaryWs.addRow([`📊 ${yearMonth} OY MOLIYAVIY HISOBOTI`]).font = { bold: true, size: 14 };
        summaryWs.addRow([]);
        addSummaryRow('Jami Tushum (Revenue)', formatAmount(summary.totalRevenue), true, 'FFD1FAE5');
        addSummaryRow('Jami Xarajat (Expense)', formatAmount(summary.totalExpenses), true, 'FFFEE2E2');
        addSummaryRow('Sof Foyda (Net Profit)', formatAmount(summary.netProfit), true, 'FFDBEAFE');
        addSummaryRow('Foyda Marjasi', `${summary.profitMargin}%`, false);
        addSummaryRow('To\'lov Yig\'ish Foizi', `${summary.collectionRate}%`, false);
        addSummaryRow('Kutilayotgan Qarzlar', formatAmount(summary.pendingDebt), false, 'FFFEF9C3');
        summaryWs.addRow([]);
        summaryWs.addRow(['XARAJATLAR TOIFALARI', '']).font = { bold: true };
        summary.expenseBreakdown.forEach(e => {
            addSummaryRow(`  • ${e.category}`, formatAmount(e.amount));
        });

        // ─── 2-varaq: To'lovlar jadvali ───────────────────────
        const payWs = wb.addWorksheet("To'lovlar");
        payWs.views = [{ state: 'frozen', ySplit: 1 }];
        payWs.columns = [
            { header: '№', key: 'no', width: 5 },
            { header: 'Talaba', key: 'student', width: 25 },
            { header: 'Telefon', key: 'phone', width: 18 },
            { header: 'Guruh', key: 'group', width: 22 },
            { header: 'Kurs', key: 'course', width: 22 },
            { header: 'Kerak (so\'m)', key: 'due', width: 16, style: { numFmt: '#,##0' } },
            { header: "To'langan", key: 'paid', width: 16, style: { numFmt: '#,##0' } },
            { header: 'Qoldiq', key: 'balance', width: 16, style: { numFmt: '#,##0' } },
            { header: 'Holat', key: 'status', width: 14 },
        ];

        // Sarlavha uslubi
        payWs.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
            cell.alignment = { horizontal: 'center' };
        });

        const statusMap: Record<string, string> = {
            paid: "To'langan ✅", partial: 'Qisman', pending: 'Kutilmoqda', overdue: 'Muddati o\'tgan ⚠️',
        };
        payments.forEach((p, i) => {
            const row = payWs.addRow({
                no: i + 1, student: p.studentName, phone: p.phone,
                group: p.groupName, course: p.courseName,
                due: p.amountDue, paid: p.amountPaid, balance: p.balance,
                status: statusMap[p.status] ?? p.status,
            });
            row.getCell('status').fill = {
                type: 'pattern', pattern: 'solid',
                fgColor: { argb: p.status === 'paid' ? 'FFD1FAE5' : p.status === 'overdue' ? 'FFFEE2E2' : 'FFFEF9C3' },
            };
        });

        return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
    }

    // ════════════════════════════════════════════════════════
    // EXPORT: QARZDORLAR — PDF
    // ════════════════════════════════════════════════════════

    async exportDebtorsToPDF(minDebt: number = 0): Promise<Buffer> {
        const debtors = await this.repo.getAllDebtors(minDebt);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // ─── Sarlavha ──────────────────────────────────────
            doc.fontSize(18).font('Helvetica-Bold')
                .text('Ziyo Chashmasi ERP — Qarzdorlar Ro\'yxati', { align: 'center' });
            doc.fontSize(11).font('Helvetica')
                .text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}   |   Jami: ${debtors.length} ta talaba`,
                    { align: 'center' });
            doc.moveDown(0.8);

            // ─── Jadval ────────────────────────────────────────
            const cols = { no: 30, name: 150, phone: 100, group: 160, debt: 90, overdue: 70, lastPay: 100 };
            const y0 = doc.y;
            const rowH = 22;
            let x = doc.page.margins.left;
            let y = y0;

            const drawHeader = () => {
                doc.rect(x, y, Object.values(cols).reduce((a, b) => a + b, 0), rowH)
                    .fillColor('#2563EB').fill();
                doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
                doc.text('№', x + 5, y + 6, { width: cols.no });
                doc.text('Talaba', x + cols.no + 5, y + 6, { width: cols.name });
                doc.text('Telefon', x + cols.no + cols.name + 5, y + 6, { width: cols.phone });
                doc.text('Guruh', x + cols.no + cols.name + cols.phone + 5, y + 6, { width: cols.group });
                doc.text('Qarz (so\'m)', x + cols.no + cols.name + cols.phone + cols.group + 5, y + 6, { width: cols.debt });
                doc.text('Muddati', x + cols.no + cols.name + cols.phone + cols.group + cols.debt + 5, y + 6, { width: cols.overdue });
                doc.text('Oxirgi to\'lov', x + cols.no + cols.name + cols.phone + cols.group + cols.debt + cols.overdue + 5, y + 6, { width: cols.lastPay });
                doc.fillColor('#000000').font('Helvetica');
                y += rowH;
            };

            drawHeader();

            debtors.forEach((d, idx) => {
                if (y + rowH > doc.page.height - 60) {
                    doc.addPage();
                    y = doc.page.margins.top;
                    drawHeader();
                }

                const bg = idx % 2 === 0 ? '#EFF6FF' : '#FFFFFF';
                const totalDebt = Number(d.totalDebt);
                doc.rect(x, y, Object.values(cols).reduce((a, b) => a + b, 0), rowH)
                    .fillColor(bg).fill();
                doc.fillColor(totalDebt > 500_000 ? '#DC2626' : '#1F2937').fontSize(8.5);

                let cx = x;
                doc.text(String(idx + 1), cx + 3, y + 7, { width: cols.no }); cx += cols.no;
                doc.text(d.studentName ?? '', cx + 3, y + 7, { width: cols.name }); cx += cols.name;
                doc.text(d.phone ?? '', cx + 3, y + 7, { width: cols.phone }); cx += cols.phone;
                doc.text((d.groups || []).join(', '), cx + 3, y + 7, { width: cols.group }); cx += cols.group;
                doc.text(String(Math.round(totalDebt)), cx + 3, y + 7, { width: cols.debt }); cx += cols.debt;
                doc.text(String(d.overdueMonths ?? 0) + ' oy', cx + 3, y + 7, { width: cols.overdue }); cx += cols.overdue;
                doc.text(d.lastPaymentDate ?? 'Yo\'q', cx + 3, y + 7, { width: cols.lastPay });
                doc.fillColor('#000000');
                y += rowH;
            });

            // ─── Footer ────────────────────────────────────────
            const totalDebt = debtors.reduce((s, d) => s + Number(d.totalDebt), 0);
            doc.rect(x, y, Object.values(cols).reduce((a, b) => a + b, 0), rowH)
                .fillColor('#DBEAFE').fill();
            doc.fillColor('#1E40AF').font('Helvetica-Bold').fontSize(9)
                .text('JAMI', x + cols.no + 5, y + 7, { width: cols.name })
                .text(String(Math.round(totalDebt)),
                    x + cols.no + cols.name + cols.phone + cols.group + 3, y + 7, { width: cols.debt });

            doc.end();
        });
    }
}
