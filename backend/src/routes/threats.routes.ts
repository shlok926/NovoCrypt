import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import * as threatsService from '../services/threats.service';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import dns from 'dns';

const router = Router();

const emailSchema = z.string().email().max(255).trim().toLowerCase();

// GET /api/threats/feed
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, category, severity } = req.query;
    const feed = await threatsService.getThreatFeed(
      parseInt(page as string),
      parseInt(limit as string),
      category as string | undefined,
      severity as string | undefined
    );
    res.json({ success: true, data: feed });
  } catch (error) {
    console.error('Error fetching threat feed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch threat feed' });
  }
});

// GET /api/threats/live
router.get('/live', async (req: Request, res: Response) => {
  try {
    const liveThreats = await threatsService.fetchLiveQuantumThreats();
    res.json({ success: true, data: liveThreats });
  } catch (error) {
    console.error('Error fetching live threats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch live threats' });
  }
});

// GET /api/threats/level
router.get('/level', async (req: Request, res: Response) => {
  try {
    const threatLevel = await threatsService.calculateGlobalThreatLevel();
    res.json({ success: true, data: threatLevel });
  } catch (error) {
    console.error('Error calculating threat level:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate threat level' });
  }
});

// GET /api/threats/advisories
router.get('/advisories', async (req: Request, res: Response) => {
  try {
    const advisories = await threatsService.getGovernmentAdvisories();
    res.json({ success: true, data: advisories });
  } catch (error) {
    console.error('Error fetching advisories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advisories' });
  }
});

// GET /api/threats/vendors
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await threatsService.getVendorAlerts();
    res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('Error fetching vendor alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor alerts' });
  }
});

// GET /api/threats/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await threatsService.getThreatStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// POST /api/threats/subscribe
router.post(
  '/subscribe',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { email, severityThreshold } = req.body;
      let validEmail: string;
      try {
        validEmail = emailSchema.parse(email);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      if (!severityThreshold) {
        return res.status(400).json({
          success: false,
          message: 'Severity threshold is required',
        });
      }
      const { subscription } = await threatsService.subscribeToAlerts(validEmail, severityThreshold);
      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to threat alerts',
        data: subscription,
      });
    } catch (error) {
      console.error('Error subscribing to alerts:', error);
      res.status(500).json({ success: false, message: 'Failed to subscribe to alerts' });
    }
  }
);

// Configure Nodemailer for the public newsletter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'etherealpassword',
  },
});

// POST /api/threats/newsletter
router.post('/newsletter', authRateLimiter, async (req: Request, res: Response) => {
  try {
    // Honeypot Trap
    if (req.body.website) {
      console.warn(`[BOT DETECTED] Blocked subscription attempt for honeypot field. Email provided: ${req.body.email}`);
      // Return fake success to trick the bot
      return res.status(200).json({ success: true, message: 'Subscribed successfully! Welcome email sent.' });
    }

    let email: string;
    try {
      email = emailSchema.parse(req.body.email);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Advanced: DNS MX Record Validation
    try {
      const domain = email.split('@')[1];
      const mxRecords = await dns.promises.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        throw new Error('No MX records');
      }
    } catch (dnsError) {
      return res.status(400).json({ success: false, message: 'Invalid email domain (Server not found)' });
    }

    // Save to DB (reusing subscribe logic with default threshold)
    const { isNew, verificationToken } = await threatsService.subscribeToAlerts(email, 'low');

    if (!isNew) {
      return res.status(409).json({ success: false, message: 'You are already subscribed to the newsletter!' });
    }

    const verifyUrl = `http://localhost:5000/api/threats/verify?token=${verificationToken}`;

    // Send verification email
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
          .container { max-w-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #3b0764 100%); padding: 30px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
          .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
          .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
          .cta-button { display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 25px 0; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25); }
          .project-info { background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-size: 14px; margin-top: 25px; border-left: 4px solid #3b82f6; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .footer a { color: #7c3aed; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ NovoCrypt Security</h1>
          </div>
          <div class="content">
            <h2>Action Required: Verify Your Email</h2>
            <p>Hello,</p>
            <p>Thank you for subscribing to the <strong>NovoCrypt Quantum Threats Newsletter</strong>. To ensure you receive our real-time alerts and research on post-quantum cryptography, please verify your email address.</p>
            
            <center>
              <a href="${verifyUrl}" class="cta-button" style="color: #ffffff; text-decoration: none;">Verify My Subscription</a>
            </center>

            <div class="project-info">
              <strong>About NovoCrypt:</strong><br>
              We are a premier platform preparing organizations for the post-quantum era. By joining our newsletter, you'll receive critical Q-Day updates, NIST standardization news, and alerts on cryptographic vulnerabilities before they become active threats.
            </div>

            <p style="margin-top: 20px;">If you did not request this subscription, you can safely ignore this email.</p>
            
            <p>Stay Secure,<br><strong>The NovoCrypt Team</strong></p>
          </div>
          <div class="footer">
            <p>You received this email because you subscribed on the NovoCrypt platform.</p>
            <p>NovoCrypt Inc. | 123 Security Blvd, Cyber City | <a href="http://localhost:5173">Privacy Policy</a> | <a href="http://localhost:5000/api/threats/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: '"NovoCrypt Security" <news@novocrypt.com>',
      to: email,
      subject: 'Verify your NovoCrypt Subscription 🛡️',
      text: `Hello,\n\nPlease verify your email to subscribe to the NovoCrypt updates.\n\nStay secure,\nNovoCrypt Team`,
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent: %s", info.messageId);

    res.json({ success: true, message: 'Verification email sent! Check your inbox to confirm.' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
});

// GET /api/threats/verify
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send('Verification token is required');
    }

    const success = await threatsService.verifySubscription(token);
    
    if (success) {
      res.send(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: 'Inter', -apple-system, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              .card { background: #0f172a; padding: 50px 40px; border-radius: 16px; border: 1px solid #1e293b; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); max-width: 480px; width: 90%; text-align: center; }
              .icon-wrapper { background: rgba(34, 197, 94, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 24px auto; }
              .icon { color: #22c55e; font-size: 40px; }
              h1 { color: #f8fafc; font-size: 28px; margin: 0 0 16px 0; font-weight: 700; letter-spacing: -0.5px; }
              p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; }
              .cta { display: inline-block; padding: 14px 32px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; transition: all 0.2s; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25); }
              .cta:hover { background: #2563eb; transform: translateY(-1px); }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon-wrapper">
                <span class="icon">✓</span>
              </div>
              <h1>Email Verified Successfully</h1>
              <p>Welcome to NovoCrypt! Your subscription is now active. You'll receive real-time alerts and exclusive research on post-quantum cryptography straight to your inbox.</p>
              <a href="http://localhost:5173/dashboard" class="cta">Continue to Dashboard</a>
            </div>
          </body>
        </html>
      `);
    } else {
      res.status(400).send('Invalid or expired verification token.');
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).send('Internal server error');
  }
});

// GET /api/threats/unsubscribe
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).send('Email parameter is required');
    }

    const success = await threatsService.unsubscribeFromAlerts(email);
    
    if (success) {
      res.send(`
        <html>
          <head>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f7f6; color: #334155; }
              .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
              h1 { color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Unsubscribed Successfully</h1>
              <p>You will no longer receive alerts at <b>${email}</b>.</p>
              <br/>
              <a href="http://localhost:5173" style="color: #7c3aed; text-decoration: none;">Return to NovoCrypt</a>
            </div>
          </body>
        </html>
      `);
    } else {
      res.status(404).send('Subscription not found for this email.');
    }
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).send('Internal server error');
  }
});

// POST /api/threats/seed
router.post('/seed', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Seeding not allowed in production',
      });
    }
    await threatsService.seedSampleThreats();
    res.json({
      success: true,
      message: 'Sample threats seeded successfully',
    });
  } catch (error) {
    console.error('Error seeding threats:', error);
    res.status(500).json({ success: false, message: 'Failed to seed threats' });
  }
});

export default router;
