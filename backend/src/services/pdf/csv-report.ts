import { ThreatItem } from '@prisma/client';

export function generateCSVString(threats: ThreatItem[]): string {
  if (threats.length === 0) return '';

  const headers = ['ID', 'Severity', 'Category', 'Date', 'Source', 'Title', 'URL'];
  const rows = threats.map(t => [
    t.id,
    t.severity,
    t.category,
    new Date(t.publishedAt).toISOString(),
    `"${t.source.replace(/"/g, '""')}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    t.url
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
