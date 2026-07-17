import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';

export const reportsRouter = Router();

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

    const headers = ['ID', 'Title', 'Category', 'Severity', 'Source', 'PublishedAt'];
    const rows = threats.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.severity,
      `"${t.source.replace(/"/g, '""')}"`,
      t.publishedAt.toISOString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="threat_feed_export.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
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
