import { AES_REGEX } from '../utils/regex';

export interface KdfMatch {
  issue: 'WeakPBKDF2' | 'WeakArgon2' | 'Weakscrypt' | 'PredictableSalt' | 'ReusedSalt' | 'WeakKDF';
  api: string;
  description: string;
  matchedString: string;
}

export class KdfAnalyzer {
  public analyzeLine(line: string, astNodes?: any): KdfMatch | null {
    // 1. Weak PBKDF2 Iteration count (recommendation >= 600,000 for SHA-256)
    // Matches e.g., iterations: 1000, 10000, 100000 or pbkdf2(password, salt, 1000)
    const pbkdf2IterationsRegex = AES_REGEX.PBKDF2_ITERATIONS;
    const pbkdf2PositionalRegex = AES_REGEX.PBKDF2_POSITIONAL;
    const iterMatch = pbkdf2IterationsRegex.exec(line) || pbkdf2PositionalRegex.exec(line);
    if (iterMatch) {
      const iters = parseInt(iterMatch[1], 10);
      if (iters < 600000) {
        return {
          issue: 'WeakPBKDF2',
          api: iterMatch[0],
          description: `PBKDF2 iteration count is weak (${iters} rounds). Recommended minimum is 600,000 rounds.`,
          matchedString: iterMatch[0]
        };
      }
    }

    // 2. Weak Argon2 id parameters
    // Matches e.g., time: 1 or memoryCost: 4096 (low memory < 16MB / 16384KB)
    const argon2MemoryRegex = AES_REGEX.ARGON2_MEMORY;
    const argMatch = argon2MemoryRegex.exec(line);
    if (argMatch) {
      const memory = parseInt(argMatch[1], 10);
      if (memory < 16384) {
        return {
          issue: 'WeakArgon2',
          api: argMatch[0],
          description: `Argon2 memory cost is configured weak (${memory} KB). Recommended minimum is 19,456 KB (19 MB).`,
          matchedString: argMatch[0]
        };
      }
    }

    // 3. Weak scrypt parameters
    // Cost factor N < 16384
    const scryptNRegex = AES_REGEX.SCRYPT_N;
    const scryptMatch = scryptNRegex.exec(line);
    if (scryptMatch) {
      const n = parseInt(scryptMatch[1], 10);
      if (n < 16384) {
        return {
          issue: 'Weakscrypt',
          api: scryptMatch[0],
          description: `scrypt cost parameter N is weak (${n}). Recommended minimum is 16384.`,
          matchedString: scryptMatch[0]
        };
      }
    }

    // 4. Weak KDF hashing algorithm (MD5/SHA1 based derivation)
    // e.g. pbkdf2(..., 'sha1') or HKDF using md5
    const weakKdfHash = AES_REGEX.WEAK_KDF_HASH;
    const weakHashMatch = weakKdfHash.exec(line);
    if (weakHashMatch) {
      return {
        issue: 'WeakKDF',
        api: weakHashMatch[0],
        description: `Key derivation utilizes weak hashing algorithm (${weakHashMatch[1]}).`,
        matchedString: weakHashMatch[0]
      };
    }

    // 5. Predictable/Static salt
    // e.g. salt = 'static_salt_value' or salt = Buffer.from('abc')
    const predictableSaltRegex = AES_REGEX.PREDICTABLE_SALT;
    const saltMatch = predictableSaltRegex.exec(line);
    if (saltMatch) {
      return {
        issue: 'PredictableSalt',
        api: saltMatch[0],
        description: `Predictable/static salt value configuration detected: "${saltMatch[1]}".`,
        matchedString: saltMatch[0]
      };
    }

    return null;
  }
}
