import PDFDocument from 'pdfkit';
import { ThreatItem } from '@prisma/client';

export async function generateWeeklyPDFBuffer(threats: ThreatItem[]): Promise<Buffer> {
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
        .text('Weekly Quantum Threat Summary', { align: 'center' })
        .moveDown(2);

      doc.fillColor('black');

      // Date Range
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      doc
        .fontSize(12)
        .text(`Date Range: ${lastWeek.toLocaleDateString()} to ${today.toLocaleDateString()}`)
        .moveDown(1);

      // Summary Stats
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Total Threats Detected: ${threats.length}`)
        .moveDown(0.5);

      const criticalCount = threats.filter(t => t.severity === 'critical').length;
      const highCount = threats.filter(t => t.severity === 'high').length;
      
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('red')
        .text(`Critical Severity: ${criticalCount}`)
        .fillColor('orange')
        .text(`High Severity: ${highCount}`)
        .fillColor('black')
        .moveDown(2);

      // Threat Items
      doc.fontSize(16).font('Helvetica-Bold').text('Recent Threats').moveDown(1);

      if (threats.length === 0) {
        doc.fontSize(12).font('Helvetica').text('No significant threats detected in the past week.');
      }

      for (const threat of threats) {
        // Draw card background
        doc.rect(doc.x, doc.y, doc.page.width - 100, 100).fillAndStroke('#f8fafc', '#e2e8f0');
        
        doc.fillColor('black').moveDown(0.5);
        
        // Severity Badge
        let badgeColor = 'blue';
        if (threat.severity === 'critical') badgeColor = 'red';
        if (threat.severity === 'high') badgeColor = 'orange';
        
        doc.fillColor(badgeColor).fontSize(10).font('Helvetica-Bold').text(`[${threat.severity.toUpperCase()}]`, doc.x + 10, doc.y);
        
        // Title
        doc.fillColor('black').fontSize(14).text(threat.title, doc.x, doc.y + 15, { width: doc.page.width - 120 });
        
        // Date & Source
        doc.fontSize(10).fillColor('gray').text(`Source: ${threat.source} | Date: ${new Date(threat.publishedAt).toLocaleDateString()}`, doc.x, doc.y + 5);
        
        doc.moveDown(3); // space for next card
        
        // Check for page break
        if (doc.y > doc.page.height - 150) {
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
