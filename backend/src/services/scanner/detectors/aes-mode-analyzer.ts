import { AesMode } from './aes-types';

export interface ModeMatch {
  mode: AesMode;
  issue?: 'ECBMode' | 'UnauthenticatedMode';
  description: string;
  matchedString: string;
}

export class ModeAnalyzer {
  private modePatterns = [
    { regex: /(?:\b|_)ecb(?:\b|_)/i, mode: 'ECB' as AesMode, issue: 'ECBMode' as const, desc: 'ECB (Electronic Codebook) mode leaks plaintext structures and patterns.' },
    { regex: /(?:\b|_)cbc(?:\b|_)/i, mode: 'CBC' as AesMode, issue: 'UnauthenticatedMode' as const, desc: 'CBC (Cipher Block Chaining) is an unauthenticated encryption mode vulnerable to bit-flipping and padding oracle attacks.' },
    { regex: /(?:\b|_)ctr(?:\b|_)/i, mode: 'CTR' as AesMode, issue: 'UnauthenticatedMode' as const, desc: 'CTR (Counter) is an unauthenticated stream mode vulnerable to key stream recovery if nonces are reused.' },
    { regex: /(?:\b|_)cfb(?:\b|_)/i, mode: 'CFB' as AesMode, issue: 'UnauthenticatedMode' as const, desc: 'CFB is an unauthenticated mode.' },
    { regex: /(?:\b|_)ofb(?:\b|_)/i, mode: 'OFB' as AesMode, issue: 'UnauthenticatedMode' as const, desc: 'OFB is an unauthenticated mode.' },
    { regex: /(?:\b|_)xts(?:\b|_)/i, mode: 'XTS' as AesMode, issue: 'UnauthenticatedMode' as const, desc: 'XTS is an unauthenticated mode.' },
    { regex: /(?:\b|_)gcm(?:\b|_)/i, mode: 'GCM' as AesMode, desc: 'GCM (Galois/Counter Mode) is a secure authenticated cipher mode.' },
    { regex: /(?:\b|_)ccm(?:\b|_)/i, mode: 'CCM' as AesMode, desc: 'CCM is a secure authenticated mode.' },
    { regex: /(?:\b|_)siv(?:\b|_)/i, mode: 'SIV' as AesMode, desc: 'SIV is a secure authenticated mode.' },
    { regex: /(?:\b|_)eax(?:\b|_)/i, mode: 'EAX' as AesMode, desc: 'EAX is a secure authenticated mode.' }
  ];

  public analyzeLine(line: string, astNodes?: any): ModeMatch | null {
    for (const pattern of this.modePatterns) {
      if (pattern.regex.test(line)) {
        return {
          mode: pattern.mode,
          issue: pattern.issue,
          description: pattern.desc,
          matchedString: line.trim()
        };
      }
    }
    return null;
  }
}
