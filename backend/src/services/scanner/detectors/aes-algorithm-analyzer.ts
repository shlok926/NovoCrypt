import { AesAlgorithm } from './aes-types';

export interface AlgorithmMatch {
  algorithm: AesAlgorithm;
  keySize?: number;
  matchedString: string;
  isWeakSize: boolean;
}

export class AlgorithmAnalyzer {
  public analyzeLine(line: string, astNodes?: any): AlgorithmMatch | null {
    // Recognize AES sizes: 128, 192, 256
    // Match common aliases: aes-128, aes128, aes-192, aes192, aes-256, aes256
    const aesRegex = /\b(aes)[-_]?(128|192|256)\b/i;
    const match = aesRegex.exec(line);
    
    if (match) {
      const size = parseInt(match[2], 10);
      const alg: AesAlgorithm = size === 128 ? 'AES-128' : (size === 192 ? 'AES-192' : 'AES-256');
      return {
        algorithm: alg,
        keySize: size,
        matchedString: match[0],
        isWeakSize: false
      };
    }

    // Weak/non-standard key lengths or custom cipher names
    const weakAesRegex = /\b(aes)[-_]?(64|512|1024)\b/i;
    const weakMatch = weakAesRegex.exec(line);
    if (weakMatch) {
      const size = parseInt(weakMatch[2], 10);
      return {
        algorithm: 'Unknown',
        keySize: size,
        matchedString: weakMatch[0],
        isWeakSize: true
      };
    }

    return null;
  }
}
