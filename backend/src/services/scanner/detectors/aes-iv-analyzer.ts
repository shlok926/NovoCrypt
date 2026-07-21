import { AES_REGEX } from '../utils/regex';

export interface IvMatch {
  issue: 'StaticIV' | 'ZeroIV' | 'ConstantNonce';
  api: string;
  description: string;
  matchedString: string;
}

export class IVAnalyzer {
  public analyzeLine(line: string, astNodes?: any): IvMatch | null {
    // 1. Zero IV validation
    // e.g. iv = Buffer.alloc(16), iv = new Uint8Array(12), iv = [0, 0, 0...]
    const zeroIvRegex = AES_REGEX.ZERO_IV;
    const zeroMatch = zeroIvRegex.exec(line);
    if (zeroMatch) {
      return {
        issue: 'ZeroIV',
        api: zeroMatch[0],
        description: 'Symmetric initialization vector (IV) or nonce initialized with all zero bytes. Highly predictable.',
        matchedString: zeroMatch[0]
      };
    }

    // 2. Static / Hardcoded IV assignment
    // e.g. iv = 'static_iv_value' or const iv = Buffer.from('abc') or iv = '0000000000000000'
    const staticIvRegex = AES_REGEX.STATIC_IV;
    const staticMatch = staticIvRegex.exec(line);
    if (staticMatch) {
      const val = staticMatch[1] || staticMatch[2];
      // Make sure it's not a variable or import
      if (val && !/^[A-Z0-9_]+$/.test(val)) {
        return {
          issue: 'StaticIV',
          api: staticMatch[0],
          description: `Symmetric fixed initialization vector (IV) detected: "${val}". Degrades block cipher security.`,
          matchedString: staticMatch[0]
        };
      }
    }

    // 3. Constant Nonce / predictability
    // e.g. const nonce = 123 or nonce = 'constant'
    const constantNonceRegex = AES_REGEX.CONSTANT_NONCE;
    const nonceMatch = constantNonceRegex.exec(line);
    if (nonceMatch) {
      return {
        issue: 'ConstantNonce',
        api: nonceMatch[0],
        description: 'Symmetric encryption nonce initialized using a fixed constant.',
        matchedString: nonceMatch[0]
      };
    }

    return null;
  }
}
