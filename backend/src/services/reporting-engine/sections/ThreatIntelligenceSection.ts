import { ReportSection, ReportContext } from '../ReportSection';
import { prisma } from '../../../config/database';
import { ThreatItem } from '@prisma/client';

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export class ThreatIntelligenceSection implements ReportSection {
  id = 'threat_intelligence';
  title = 'Threat Intelligence';
  order = 10;
  
  private data: ThreatItem[] = [];

  async fetchData(context: ReportContext): Promise<boolean> {
    const threats = await prisma.threatItem.findMany({
      where: {
        publishedAt: {
          gte: context.startDate,
          lte: context.endDate,
        }
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (threats.length === 0) return false;

    // Prioritize by severity
    threats.sort((a, b) => {
      const weightA = SEVERITY_WEIGHT[a.severity.toLowerCase()] || 0;
      const weightB = SEVERITY_WEIGHT[b.severity.toLowerCase()] || 0;
      return weightB - weightA;
    });

    this.data = threats.slice(0, 50); // Limit to top 50
    return true;
  }

  async renderPdf(doc: PDFKit.PDFDocument, context: ReportContext): Promise<void> {
    const criticalCount = this.data.filter(t => t.severity === 'critical').length;
    const highCount = this.data.filter(t => t.severity === 'high').length;

    // Stats Row
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text('Threat Statistics');
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
       .text(`Total Threats: ${this.data.length} | Critical: ${criticalCount} | High: ${highCount}`);
    doc.moveDown(1.5);

    // Render Threats
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Top Critical Threats');
    doc.moveDown(0.5);

    for (const t of this.data) {
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text(t.title);
      
      const cveText = t.cveId ? ` | CVE: ${t.cveId}` : '';
      doc.fontSize(9).font('Helvetica').fillColor('#64748b')
         .text(`Severity: ${t.severity.toUpperCase()} | Category: ${t.category.toUpperCase()}${cveText} | Published: ${t.publishedAt.toISOString().split('T')[0]}`);
      doc.moveDown(0.5);

      if (t.affectedAlgorithms && t.affectedAlgorithms.length > 0) {
        doc.fontSize(9).fillColor('#ef4444').text(`Affected Algorithms: ${t.affectedAlgorithms.join(', ')}`);
        doc.moveDown(0.2);
      }

      doc.fontSize(10).fillColor('#475569').text(t.summary, { align: 'justify', lineGap: 1.5 });
      doc.moveDown(0.5);

      if (t.impact) {
        doc.fontSize(9).fillColor('#334155').text(`Impact: `, { continued: true }).fillColor('#475569').text(t.impact);
      }
      if (t.recommendation) {
        doc.fontSize(9).fillColor('#334155').text(`Recommendation: `, { continued: true }).fillColor('#475569').text(t.recommendation);
      }
      
      doc.moveDown(1);
    }
  }
}
