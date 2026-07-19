import { ReportSection, ReportContext } from '../ReportSection';
import { prisma } from '../../../config/database';

export class ScannerResultsSection implements ReportSection {
  id = 'scanner';
  title = 'Scanner Results';
  order = 20;
  private scanResults: any[] = [];

  async fetchData(context: ReportContext): Promise<boolean> {
    const scans = await prisma.scanResult.findMany({
      where: {
        userId: context.userId,
        scannedAt: {
          gte: context.startDate,
          lte: context.endDate,
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: 5,
    });

    if (scans.length === 0) return false;
    this.scanResults = scans;
    return true; 
  }

  async renderPdf(doc: PDFKit.PDFDocument, context: ReportContext): Promise<void> {
    const scans = this.scanResults;
    const criticalScans = scans.filter(s => s.riskLevel === 'critical').length;

    // Summary Line
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text('Recent Scan Summary');
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
       .text(`Total Scans: ${scans.length} | Critical Risk Scans: ${criticalScans}`);
    doc.moveDown(1.5);

    // List recent scans
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Latest Scanner Activity');
    doc.moveDown(0.5);

    for (const scan of scans) {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text(`Target: ${scan.inputTarget || 'Unknown'} (${scan.scanType.toUpperCase()})`);
      
      const findingsCount = Array.isArray(scan.findings) ? scan.findings.length : 0;
      doc.fontSize(9).font('Helvetica').fillColor('#64748b')
         .text(`Risk Level: ${scan.riskLevel.toUpperCase()} | Score: ${scan.overallScore}/100 | Findings: ${findingsCount} | Scanned: ${scan.scannedAt.toISOString().split('T')[0]}`);
      
      doc.moveDown(1);
    }
  }
}
