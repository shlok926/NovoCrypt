import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { z } from 'zod';

export const reportsRouter = Router();

const PreferencesSchema = z.object({
  weeklySummary: z.boolean().optional(),
  monthlyCompliance: z.boolean().optional(),
});

// Get User Report Preferences
reportsRouter.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let pref = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.userPreference.create({
        data: { userId },
      });
    }

    res.json({ success: true, data: pref });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
  }
});

// Update User Report Preferences
reportsRouter.put('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const parseResult = PreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, message: 'Invalid data', errors: parseResult.error.format() });
    }

    const { weeklySummary, monthlyCompliance } = parseResult.data;

    const pref = await prisma.userPreference.upsert({
      where: { userId },
      update: {
        weeklySummary: weeklySummary !== undefined ? weeklySummary : undefined,
        monthlyCompliance: monthlyCompliance !== undefined ? monthlyCompliance : undefined,
      },
      create: {
        userId,
        weeklySummary: weeklySummary || false,
        monthlyCompliance: monthlyCompliance || false,
      },
    });

    res.json({ success: true, data: pref });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

// Generate report
reportsRouter.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.body;
    const userId = req.user?.id;

    if (!userId || !assessmentId) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const fileUrl = `/reports/${assessmentId}-${Date.now()}.pdf`;
    const mockReport = {
      id: `report-${Date.now()}`,
      userId: userId,
      assessmentId: assessmentId,
      fileUrl: fileUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.json(mockReport);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

// Export CSV
reportsRouter.get('/export-csv', requireAuth, async (req: Request, res: Response) => {
  try {
    const threats = await prisma.threatItem.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });

    if (!threats || threats.length === 0) {
      return res.status(404).json({ success: false, message: 'No threats found' });
    }

    const headers = ['Threat ID', 'Title', 'Severity', 'Category', 'CVE ID', 'Affected Algorithms', 'Impact', 'Recommendation', 'Summary', 'Source', 'Reference URL', 'Published Date'];
    
    const escapeCSV = (str: string | null | undefined) => {
      if (!str) return '""';
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = threats.map(t => [
      t.id,
      escapeCSV(t.title),
      t.severity,
      t.category,
      escapeCSV(t.cveId),
      escapeCSV(t.affectedAlgorithms ? t.affectedAlgorithms.join(', ') : ''),
      escapeCSV(t.impact),
      escapeCSV(t.recommendation),
      escapeCSV(t.summary),
      escapeCSV(t.source),
      escapeCSV(t.url),
      t.publishedAt.toISOString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="novocrypt-threat-feed-${dateStr}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
});

// Export PDF
reportsRouter.get('/export-pdf', requireAuth, async (req: Request, res: Response) => {
  try {
    const threats = await prisma.threatItem.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 100,
    });

    if (!threats || threats.length === 0) {
      return res.status(404).json({ success: false, message: 'No threats found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="novocrypt-threat-feed-${dateStr}.pdf"`);

    doc.pipe(res);

    // --- Cover Section ---
    doc.moveDown(4);
    doc.fontSize(28).fillColor('#0ea5e9').text('NovoCrypt Threat Intelligence Report', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).fillColor('#64748b').text(`Generated Date: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#64748b').text(`Total Threat Count: ${threats.length}`, { align: 'center' });
    doc.moveDown(6);

    // --- Threat Summary ---
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    threats.forEach(t => {
      if (counts[t.severity as keyof typeof counts] !== undefined) {
        counts[t.severity as keyof typeof counts]++;
      }
    });

    doc.fontSize(20).fillColor('#334155').text('Threat Summary', { underline: true });
    doc.moveDown(1);
    doc.fontSize(14).fillColor('#ef4444').text(`Critical count: ${counts.critical}`);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#f97316').text(`High count: ${counts.high}`);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#eab308').text(`Medium count: ${counts.medium}`);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#3b82f6').text(`Low count: ${counts.low}`);
    
    doc.addPage();

    // --- Detailed Threat Table ---
    doc.fontSize(20).fillColor('#334155').text('Detailed Threat Table', { underline: true });
    doc.moveDown(1);

    threats.forEach((t, i) => {
      // Title
      doc.fontSize(16).fillColor('#0f172a').text(`${i + 1}. ${t.title}`, { continued: false });
      doc.moveDown(0.3);

      // Metadata
      const cveText = t.cveId ? ` | CVE: ${t.cveId}` : '';
      doc.fontSize(10).fillColor('#64748b')
         .text(`Severity: ${t.severity.toUpperCase()} | Category: ${t.category.toUpperCase()}${cveText} | Published: ${t.publishedAt.toISOString().split('T')[0]}`);
      doc.moveDown(0.5);

      // Affected Algorithms
      if (t.affectedAlgorithms && t.affectedAlgorithms.length > 0) {
        doc.fontSize(10).fillColor('#ef4444').text(`Affected Algorithms: ${t.affectedAlgorithms.join(', ')}`);
        doc.moveDown(0.2);
      }

      // Summary
      doc.fontSize(11).fillColor('#475569').text(t.summary, { align: 'justify' });
      doc.moveDown(0.5);
      
      // Impact & Recommendation
      if (t.impact) {
        doc.fontSize(10).fillColor('#334155').text(`Impact: `, { continued: true }).fillColor('#475569').text(t.impact);
      }
      if (t.recommendation) {
        doc.fontSize(10).fillColor('#334155').text(`Recommendation: `, { continued: true }).fillColor('#475569').text(t.recommendation);
      }
      doc.moveDown(0.5);

      // Source & URL
      doc.fontSize(10).fillColor('#0ea5e9').text(`Source: ${t.source}`, { link: t.url, underline: true });
      doc.moveDown(1.5);
    });

    // --- Footer ---
    const pages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
    for (let i = 0; i < pages; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).fillColor('#94a3b8').text(
        'Generated by NovoCrypt',
        50,
        doc.page.height - 50,
        { align: 'center', lineBreak: false }
      );
    }

    doc.end();
  } catch (error) {
    console.error('Failed to export PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to export PDF' });
  }
});

// List reports
reportsRouter.get('/list', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const mockReports = [
      {
        id: 'report-1',
        userId: userId,
        assessmentId: 'assess-1',
        fileUrl: '/reports/report-1.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    res.json(mockReports);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Get single report
reportsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const mockReport = {
      id: id,
      userId: userId,
      assessmentId: 'assess-1',
      fileUrl: `/reports/${id}.pdf`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.json(mockReport);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch report' });
  }
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'etherealpassword',
  },
});

reportsRouter.post('/schedule', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type, email } = req.body;
    
    // Send immediate email simulation for scheduled reports
    const mailOptions = {
      from: '"NovoCrypt Reports" <noreply@novocrypt.com>',
      to: email || req.user?.email || 'user@example.com',
      subject: `Your Scheduled Report: ${type}`,
      text: `Hello,\n\nAttached is your scheduled ${type} report.\n\nBest,\nNovoCrypt Team`,
      html: `<b>Hello,</b><br><br>Here is your scheduled <strong>${type}</strong> report as requested.<br><br>Best,<br>NovoCrypt Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

    res.json({ success: true, message: 'Report scheduled and test email sent!', messageId: info.messageId });
  } catch (error) {
    console.error("Error scheduling email:", error);
    res.status(500).json({ success: false, message: 'Failed to schedule report', error });
  }
});
