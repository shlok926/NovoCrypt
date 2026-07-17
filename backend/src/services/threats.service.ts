import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import Parser from 'rss-parser';
import crypto from 'crypto';

const parser = new Parser();

const prisma = new PrismaClient();

export interface ThreatFeedItem {
  id?: string;
  title: string;
  summary: string;
  source: string;
  category: 'advisory' | 'research' | 'breach' | 'vendor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  publishedAt: Date;
}

// Mock data for when database is unavailable
const MOCK_THREATS = [
  {
    id: '1',
    title: 'New Quantum Computing Milestone: 1000+ Qubit System Achieved',
    summary: 'Researchers announce breakthrough in quantum computing with system exceeding 1000 qubits, accelerating timeline for cryptographically relevant quantum computers.',
    source: 'Quantum Computing Journal',
    category: 'research' as const,
    severity: 'critical' as const,
    url: 'https://example.com/quantum-milestone',
    publishedAt: new Date('2026-05-18'),
  },
  {
    id: '2',
    title: 'NIST Finalizes Post-Quantum Cryptography Standards',
    summary: 'NIST officially publishes ML-KEM, ML-DSA, and SLH-DSA as approved post-quantum cryptography algorithms for federal use.',
    source: 'NIST',
    category: 'advisory' as const,
    severity: 'high' as const,
    url: 'https://example.com/nist-pqc',
    publishedAt: new Date('2026-05-17'),
  },
  {
    id: '3',
    title: 'Major Tech Company Announces Quantum-Safe Migration Plan',
    summary: 'Leading enterprise commits to quantum-safe encryption by 2027, influencing industry-wide adoption of post-quantum cryptography.',
    source: 'Tech News Daily',
    category: 'vendor' as const,
    severity: 'high' as const,
    url: 'https://example.com/migration-plan',
    publishedAt: new Date('2026-05-16'),
  },
  {
    id: '4',
    title: 'New Vulnerability in RSA Implementation Discovered',
    summary: 'Security researchers find timing side-channel attack in popular RSA library, affecting millions of devices.',
    source: 'Security Research Lab',
    category: 'breach' as const,
    severity: 'high' as const,
    url: 'https://example.com/rsa-vuln',
    publishedAt: new Date('2026-05-15'),
  },
  {
    id: '5',
    title: 'Successful Cryptanalysis of Hybrid Encryption Scheme',
    summary: 'Academic paper demonstrates attack on improperly implemented hybrid encryption systems combining RSA and symmetric algorithms.',
    source: 'Cryptography Review',
    category: 'research' as const,
    severity: 'medium' as const,
    url: 'https://example.com/hybrid-attack',
    publishedAt: new Date('2026-05-14'),
  },
  {
    id: '6',
    title: 'Industry Report: 80% of Organizations Unprepared for Quantum Threats',
    summary: 'Survey reveals most enterprises lack quantum readiness strategies, despite growing threats from quantum computing advances.',
    source: 'Cyber Security Report',
    category: 'advisory' as const,
    severity: 'medium' as const,
    url: 'https://example.com/readiness-report',
    publishedAt: new Date('2026-05-13'),
  },
  {
    id: '7',
    title: 'Zero Trust Architecture Gains Momentum in Post-Quantum Planning',
    source: 'Enterprise Security Today',
    category: 'research' as const,
    severity: 'low' as const,
    summary: 'Organizations adopting zero-trust models as foundation for quantum-safe infrastructure.',
    url: 'https://example.com/zero-trust',
    publishedAt: new Date('2026-05-12'),
  },
  {
    id: '8',
    title: 'Positive: Lattice-Based Crypto Shows 20-Year Security Promise',
    summary: 'Research indicates lattice-based cryptography remains secure against quantum and classical attacks for extended periods.',
    source: 'Cryptography Advances',
    category: 'research' as const,
    severity: 'low' as const,
    url: 'https://example.com/lattice-security',
    publishedAt: new Date('2026-05-11'),
  },
];

/**
 * Create or fetch threat items
 */
export async function createThreatItem(data: ThreatFeedItem) {
  try {
    return await prisma.threatItem.create({
      data: {
        title: data.title,
        summary: data.summary,
        source: data.source,
        category: data.category,
        severity: data.severity,
        url: data.url,
        publishedAt: data.publishedAt,
      },
    });
  } catch (error) {
    console.warn('Database unavailable, simulating threat creation');
    return {
      id: `threat_${Date.now()}`,
      ...data,
    };
  }
}

/**
 * Get paginated threat feed
 */
export async function getThreatFeed(
  page: number = 1,
  limit: number = 20,
  category?: string,
  severity?: string
) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) where.category = category;
    if (severity) where.severity = severity;

    const [items, total] = await Promise.all([
      prisma.threatItem.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.threatItem.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.warn('Database unavailable, using mock threat data');
    
    // Filter mock data
    let filtered = MOCK_THREATS;
    if (category) filtered = filtered.filter(t => t.category === category);
    if (severity) filtered = filtered.filter(t => t.severity === severity);

    const skip = (page - 1) * limit;
    const items = filtered.slice(skip, skip + limit);
    const total = filtered.length;

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}

/**
 * Calculate global threat level based on recent threats
 */
export async function calculateGlobalThreatLevel(): Promise<{
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  summary: string;
}> {
  try {
    const recentThreats = await prisma.threatItem.findMany({
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (recentThreats.length === 0) {
      return {
        level: 'low',
        score: 20,
        trend: 'stable',
        summary: 'No recent threats detected',
      };
    }

    // Calculate threat score based on severity
    let score = 0;
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    recentThreats.forEach((threat) => {
      severityCounts[threat.severity as keyof typeof severityCounts]++;
      switch (threat.severity) {
        case 'critical':
          score += 40;
          break;
        case 'high':
          score += 20;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
      }
    });

    score = Math.min(100, score);

    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 70) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 30) level = 'medium';
    else level = 'low';

    // Calculate trend (simplified)
    const oldThreats = await prisma.threatItem.count({
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentThreats.length > oldThreats * 1.2) trend = 'increasing';
    else if (recentThreats.length < oldThreats * 0.8) trend = 'decreasing';

    return {
      level,
      score: Math.round(score),
      trend,
      summary: `${severityCounts.critical} critical, ${severityCounts.high} high severity threats detected`,
    };
  } catch (error) {
    console.warn('Database unavailable, calculating threat level from mock data');
    
    // Calculate from mock data
    let score = 0;
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    
    MOCK_THREATS.forEach((threat) => {
      severityCounts[threat.severity]++;
      switch (threat.severity) {
        case 'critical': score += 40; break;
        case 'high': score += 20; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    });

    score = Math.min(100, score);

    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 70) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 30) level = 'medium';
    else level = 'low';

    return {
      level,
      score: Math.round(score),
      trend: 'increasing',
      summary: `${severityCounts.critical} critical, ${severityCounts.high} high severity threats detected`,
    };
  }
}

/**
 * Get government advisories
 */
export async function getGovernmentAdvisories() {
  try {
    return await prisma.threatItem.findMany({
      where: { category: 'advisory' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });
  } catch (error) {
    console.warn('Database unavailable, using mock advisories');
    return MOCK_THREATS.filter(t => t.category === 'advisory').slice(0, 10);
  }
}

/**
 * Get vendor vulnerability alerts
 */
export async function getVendorAlerts() {
  try {
    return await prisma.threatItem.findMany({
      where: { category: 'vendor' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });
  } catch (error) {
    console.warn('Database unavailable, using mock vendor alerts');
    return MOCK_THREATS.filter(t => t.category === 'vendor').slice(0, 10);
  }
}

/**
 * Subscribe user to threat alerts
 */
export async function subscribeToAlerts(email: string, severityThreshold: string) {
  try {
    const existing = await prisma.threatSubscription.findFirst({
      where: { email },
    });

    if (existing) {
      // Update existing subscription
      const subscription = await prisma.threatSubscription.update({
        where: { id: existing.id },
        data: { severityThreshold },
      });
      return { subscription, isNew: false };
    }

    // Create new subscription
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const subscription = await prisma.threatSubscription.create({
      data: {
        email,
        severityThreshold,
        verified: false,
        verificationToken,
      },
    });
    return { subscription, isNew: true, verificationToken };
  } catch (error) {
    console.warn('Database unavailable, simulating subscription');
    return {
      subscription: {
        id: `sub_${Date.now()}`,
        email,
        severityThreshold,
        verified: false,
        verificationToken: 'dummy-token',
        createdAt: new Date(),
      },
      isNew: true,
      verificationToken: 'dummy-token'
    };
  }
}

/**
 * Verify a subscription token
 */
export async function verifySubscription(token: string) {
  try {
    const subscription = await prisma.threatSubscription.findFirst({
      where: { verificationToken: token },
    });

    if (!subscription) {
      return false;
    }

    await prisma.threatSubscription.update({
      where: { id: subscription.id },
      data: {
        verified: true,
        verificationToken: null,
      },
    });

    return true;
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return false;
  }
}

/**
 * Unsubscribe user from threat alerts
 */
export async function unsubscribeFromAlerts(email: string) {
  try {
    const existing = await prisma.threatSubscription.findFirst({
      where: { email },
    });

    if (!existing) {
      return false; // Not found
    }

    await prisma.threatSubscription.delete({
      where: { id: existing.id },
    });
    return true;
  } catch (error) {
    console.warn('Database unavailable, simulating unsubscription');
    return true;
  }
}

/**
 * Get threat statistics
 */
export async function getThreatStatistics() {
  try {
    const stats = await Promise.all([
      prisma.threatItem.count(),
      prisma.threatItem.groupBy({
        by: ['severity'],
        _count: true,
      }),
      prisma.threatItem.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    return {
      totalThreats: stats[0],
      bySeverity: stats[1],
      byCategory: stats[2],
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.warn('Database unavailable, calculating statistics from mock data');
    
    // Calculate from mock data
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const categoryCounts: Record<string, number> = {};

    MOCK_THREATS.forEach((threat) => {
      severityCounts[threat.severity]++;
      categoryCounts[threat.category] = (categoryCounts[threat.category] || 0) + 1;
    });

    return {
      totalThreats: MOCK_THREATS.length,
      bySeverity: severityCounts,
      byCategory: categoryCounts,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Fetch real-time threats and news from RSS feeds
 */
export async function fetchLiveQuantumThreats(): Promise<ThreatFeedItem[]> {
  try {
    const feedUrls = [
      'https://news.google.com/rss/search?q=post-quantum+cryptography+OR+quantum+computing+breakthrough&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=encryption+vulnerability+OR+data+breach&hl=en-US&gl=US&ceid=US:en'
    ];

    const allNews: ThreatFeedItem[] = [];

    for (const url of feedUrls) {
      const feed = await parser.parseURL(url);
      
      const items = feed.items.slice(0, 5).map(item => {
        const isVulnerability = item.title?.toLowerCase().includes('vulnerability') || item.title?.toLowerCase().includes('breach');
        
        return {
          title: item.title || 'Quantum News Update',
          summary: item.contentSnippet || item.title || 'No description available',
          source: item.source || feed.title || 'Global News',
          category: isVulnerability ? 'breach' : 'research',
          severity: isVulnerability ? 'high' : 'medium',
          url: item.link || '#',
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        } as ThreatFeedItem;
      });

      allNews.push(...items);
    }

    return allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  } catch (error) {
    console.error('Error fetching live RSS threats:', error);
    return [];
  }
}

/**
 * Seed sample threat data for development
 */
export async function seedSampleThreats() {
  const sampleThreats: ThreatFeedItem[] = [
    {
      title: 'NSA Warns: Start Quantum-Safe Encryption Migration Now',
      summary:
        'US National Security Agency issues directive for agencies to transition to quantum-resistant cryptography',
      source: 'NSA',
      category: 'advisory',
      severity: 'critical',
      url: 'https://nsa.gov/quantum-safe',
      publishedAt: new Date('2024-05-10'),
    },
    {
      title: 'Google Achieves Quantum Advantage in Error Correction',
      summary:
        'Google announces breakthrough in quantum error correction, moving closer to practical quantum computers',
      source: 'Google Research',
      category: 'research',
      severity: 'high',
      url: 'https://google-research.blogspot.com/quantum',
      publishedAt: new Date('2024-05-08'),
    },
    {
      title: 'NIST Finalizes Post-Quantum Cryptography Standards',
      summary:
        'NIST officially standardizes CRYSTALS-Kyber and CRYSTALS-Dilithium algorithms for quantum-safe encryption',
      source: 'NIST',
      category: 'advisory',
      severity: 'high',
      url: 'https://nist.gov/quantum-standards',
      publishedAt: new Date('2024-05-05'),
    },
    {
      title: 'Major Breach: Store-Bought Encryption Fails',
      summary: 'Large retailer suffers data breach due to weak cryptographic implementation',
      source: 'Cybersecurity News',
      category: 'breach',
      severity: 'critical',
      url: 'https://example.com/breach',
      publishedAt: new Date('2024-05-03'),
    },
  ];

  for (const threat of sampleThreats) {
    const exists = await prisma.threatItem.findFirst({
      where: { title: threat.title },
    });

    if (!exists) {
      await createThreatItem(threat);
    }
  }

  console.log('✓ Sample threats seeded');
}

/**
 * Clean old threats (keep only last 90 days)
 */
export async function cleanOldThreats() {
  const result = await prisma.threatItem.deleteMany({
    where: {
      publishedAt: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`✓ Deleted ${result.count} old threat records`);
  return result;
}
