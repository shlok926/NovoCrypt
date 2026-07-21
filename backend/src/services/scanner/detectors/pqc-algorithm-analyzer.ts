import { PqcAlgorithm } from './pqc-types';
import { PQC_REGEX } from '../utils/regex';

export interface PqcMatch {
  algorithm: PqcAlgorithm;
  parameterSet: string;
  securityLevel: number;
  api: string;
  description: string;
  matchedString: string;
}

export class PqcAlgorithmAnalyzer {
  public analyzeLine(line: string, astNodes?: any): PqcMatch | null {
    // 1. ML-KEM / Kyber
    // Matches: ML-KEM-512, ML-KEM-768, ML-KEM-1024, Kyber768, Kyber-768, ML_KEM_768
    const mlkemRegex = PQC_REGEX.ML_KEM;
    const mlkemMatch = mlkemRegex.exec(line);
    if (mlkemMatch) {
      const level = mlkemMatch[2] === '512' ? 1 : (mlkemMatch[2] === '768' ? 3 : 5);
      return {
        algorithm: 'ML-KEM',
        parameterSet: `ML-KEM-${mlkemMatch[2]}`,
        securityLevel: level,
        api: mlkemMatch[0],
        description: `Standardized post-quantum key encapsulation mechanism ML-KEM detected (${mlkemMatch[0]}).`,
        matchedString: mlkemMatch[0]
      };
    }

    // 2. ML-DSA / Dilithium
    // Matches: ML-DSA-44, ML-DSA-65, ML-DSA-87, Dilithium2, Dilithium3, Dilithium5, ML_DSA_65
    const mldsaRegex = PQC_REGEX.ML_DSA;
    const mldsaMatch = mldsaRegex.exec(line);
    if (mldsaMatch) {
      let paramSet = mldsaMatch[0];
      let level = 3;
      if (mldsaMatch[2] === '44' || mldsaMatch[2] === '2') { level = 2; paramSet = 'ML-DSA-44'; }
      if (mldsaMatch[2] === '65' || mldsaMatch[2] === '3') { level = 3; paramSet = 'ML-DSA-65'; }
      if (mldsaMatch[2] === '87' || mldsaMatch[2] === '5') { level = 5; paramSet = 'ML-DSA-87'; }

      return {
        algorithm: 'ML-DSA',
        parameterSet: paramSet,
        securityLevel: level,
        api: mldsaMatch[0],
        description: `Standardized post-quantum digital signature algorithm ML-DSA detected (${mldsaMatch[0]}).`,
        matchedString: mldsaMatch[0]
      };
    }

    // 3. SLH-DSA / SPHINCS+ / SPHINCS_plus
    // Matches: SLH-DSA, SPHINCS+, SPHINCS_plus
    const slhdsaRegex = PQC_REGEX.SLH_DSA;
    const slhdsaMatch = slhdsaRegex.exec(line);
    if (slhdsaMatch) {
      return {
        algorithm: 'SLH-DSA',
        parameterSet: 'SLH-DSA-128f',
        securityLevel: 1,
        api: slhdsaMatch[0],
        description: `Standardized stateless hash-based signature algorithm SLH-DSA detected (${slhdsaMatch[0]}).`,
        matchedString: slhdsaMatch[0]
      };
    }

    return null;
  }
}
