import PDFDocument from 'pdfkit';
import { ThreatItem } from '@prisma/client';

export async function generateMonthlyPDFBuffer(threats: ThreatItem[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('NovoCrypt Intelligence', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(16)
        .font('Helvetica')
        .fillColor('gray')
        .text('Monthly Compliance Report', { align: 'center' })
        .moveDown(2);

      doc.fillColor('black');

      // Date Range
      const today = new Date();
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      doc
        .fontSize(12)
        .text(`Date Range: ${lastMonth.toLocaleDateString()} to ${today.toLocaleDateString()}`)
        .moveDown(1);

      // Summary Stats
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Total Threats Detected: ${threats.length}`)
        .moveDown(0.5);

      const criticalCount = threats.filter(t => t.severity === 'critical').length;
      
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('red')
        .text(`Critical Vulnerabilities Discovered: ${criticalCount}`)
        .fillColor('black')
        .moveDown(2);

      // Threat Items Table (Simulated with text for simplicity in this sprint)
      doc.fontSize(16).font('Helvetica-Bold').text('NIST PQC Updates & Critical Alerts').moveDown(1);

      if (threats.length === 0) {
        doc.fontSize(12).font('Helvetica').text('No significant compliance-affecting updates this month.');
      }

      for (const threat of threats) {
        doc.fontSize(12).font('Helvetica-Bold').text(threat.title);
        doc.fontSize(10).font('Helvetica').fillColor('gray').text(`Category: ${threat.category.toUpperCase()} | Date: ${new Date(threat.publishedAt).toLocaleDateString()}`);
        doc.fillColor('black').moveDown(1);
        
        // Check for page break
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }
      }

      // Footer
      doc
        .fontSize(10)
        .fillColor('gray')
        .text(
          'Generated automatically by NovoCrypt Intelligence Engine.',
          50,
          doc.page.height - 50,
          { align: 'center', lineBreak: false }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
