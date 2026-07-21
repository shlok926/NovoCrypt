import { PqcAlgorithm } from './pqc-types';

export interface ClassicalMatch {
  algorithm: PqcAlgorithm;
  api: string;
  description: string;
  matchedString: string;
  isDeprecated?: boolean;
}

export class ClassicalCryptoAnalyzer {
  public analyzeLine(line: string, astNodes?: any): ClassicalMatch | null {
    // Check for deprecated hashing/symmetric algorithms
    const deprecatedMatch = /\b(md5|sha1|sha-1|des|rc4)\b/i.exec(line);
    if (deprecatedMatch) {
      return {
        algorithm: 'Unknown',
        api: deprecatedMatch[0],
        description: `Deprecated classical algorithm/hash detected: "${deprecatedMatch[0]}".`,
        matchedString: deprecatedMatch[0],
        isDeprecated: true
      };
    }

    // Matches classical vulnerable algorithms: RSA, DSA, ECDSA, ECDH, DH
    // Allows underscores around name, e.g. rsa_private, createECDH, etc.
    const rsaMatch = /(?:\b|_)(rsa|rsa-oaep|rsa-pss)(?:\b|_)/i.exec(line);
    if (rsaMatch) {
      return {
        algorithm: 'RSA',
        api: rsaMatch[1],
        description: 'Classical quantum-vulnerable RSA cryptography detected.',
        matchedString: rsaMatch[0]
      };
    }

    const dsaMatch = /(?:\b|_)(dsa)(?:\b|_)/i.exec(line);
    if (dsaMatch) {
      return {
        algorithm: 'ECDSA',
        api: dsaMatch[1],
        description: 'Classical quantum-vulnerable DSA digital signatures detected.',
        matchedString: dsaMatch[0]
      };
    }

    const ecdhMatch = /(?:\b|_)(ecdh|createECDH)(?:\b|_)/i.exec(line);
    if (ecdhMatch) {
      return {
        algorithm: 'ECDH',
        api: ecdhMatch[1],
        description: 'Classical quantum-vulnerable Elliptic Curve Diffie-Hellman (ECDH) key exchange detected.',
        matchedString: ecdhMatch[0]
      };
    }

    const ecdsaMatch = /(?:\b|_)(ecdsa)(?:\b|_)/i.exec(line);
    if (ecdsaMatch) {
      return {
        algorithm: 'ECDSA',
        api: ecdsaMatch[1],
        description: 'Classical quantum-vulnerable Elliptic Curve Digital Signature Algorithm (ECDSA) detected.',
        matchedString: ecdsaMatch[0]
      };
    }

    const dhMatch = /(?:\b|_)(diffie-hellman|createDiffieHellman)(?:\b|_)/i.exec(line);
    if (dhMatch) {
      return {
        algorithm: 'DH',
        api: dhMatch[1],
        description: 'Classical quantum-vulnerable Diffie-Hellman key exchange detected.',
        matchedString: dhMatch[0]
      };
    }

    // Node.js signature creation keywords
    const signMatch = /\b(createSign|sign\.sign)\b/i.exec(line);
    if (signMatch) {
      return {
        algorithm: 'ECDSA',
        api: signMatch[0],
        description: 'Classical signature creation API usage detected.',
        matchedString: signMatch[0]
      };
    }

    // Modern classical curves planning
    const x25519Match = /(?:\b|_)(x25519|curve25519|ed25519|ed448|x448)(?:\b|_)/i.exec(line);
    if (x25519Match) {
      const alg: PqcAlgorithm = x25519Match[1].toLowerCase().includes('ed25519') ? 'Ed25519' : 'X25519';
      return {
        algorithm: alg,
        api: x25519Match[1],
        description: 'Secure classical curve detected (requires post-quantum hybrid wrappers).',
        matchedString: x25519Match[0]
      };
    }

    return null;
  }
}
