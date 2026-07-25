import * as crypto from 'crypto';

export class FileFingerprint {
  public static compute(
    relativePath: string,
    content: string,
    parserVersion = '1.0.0',
    rulesVersion = '1.0.0'
  ): string {
    const normalized = relativePath.replace(/\\/g, '/');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const input = `${normalized}:${hash}:${parserVersion}:${rulesVersion}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
