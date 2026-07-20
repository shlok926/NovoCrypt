import { ScanContext } from '../types';
import { CurveDetails, curveMetadata } from './ecc-types';

export class CurveAnalyzer {
  private patterns = [
    { regex: /(secp112r1)/i, key: 'secp112r1' },
    { regex: /(secp128r1)/i, key: 'secp128r1' },
    { regex: /(secp160r1)/i, key: 'secp160r1' },
    { regex: /(secp192k1)/i, key: 'secp192k1' },
    { regex: /(secp192r1|nistp192|p-192)/i, key: 'nistp192' },
    { regex: /(secp224k1)/i, key: 'secp224k1' },
    { regex: /(secp224r1|nistp224|p-224)/i, key: 'nistp224' },
    { regex: /(secp256k1)/i, key: 'secp256k1' },
    { regex: /(secp256r1|prime256v1|nistp256|p-256)/i, key: 'nistp256' },
    { regex: /(secp384r1|nistp384|p-384)/i, key: 'nistp384' },
    { regex: /(secp521r1|nistp521|p-521)/i, key: 'nistp521' },
    { regex: /(curve25519)/i, key: 'curve25519' },
    { regex: /(x25519)/i, key: 'x25519' },
    { regex: /(ed25519)/i, key: 'ed25519' },
    { regex: /(curve448)/i, key: 'curve448' },
    { regex: /(x448)/i, key: 'x448' },
    { regex: /(ed448)/i, key: 'ed448' },
    { regex: /(brainpoolp256r1|brainpool\s*p256)/i, key: 'brainpoolp256r1' },
    { regex: /(brainpoolp384r1|brainpool\s*p384)/i, key: 'brainpoolp384r1' },
    { regex: /(brainpoolp512r1|brainpool\s*p512)/i, key: 'brainpoolp512r1' }
  ];

  public analyzeLine(line: string): { curve: CurveDetails; matchedString: string }[] {
    const results: { curve: CurveDetails; matchedString: string }[] = [];
    for (const pattern of this.patterns) {
      const match = pattern.regex.exec(line);
      if (match) {
        const details = curveMetadata[pattern.key];
        if (details) {
          results.push({
            curve: details,
            matchedString: match[0]
          });
        }
      }
    }
    return results;
  }
}
