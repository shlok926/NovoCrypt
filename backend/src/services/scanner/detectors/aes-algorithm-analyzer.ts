import { AesAlgorithm } from './aes-types';
import { AES_REGEX } from '../utils/regex';

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
    const aesRegex = AES_REGEX.ALGORITHM;
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
    const weakAesRegex = AES_REGEX.WEAK_AES;
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
