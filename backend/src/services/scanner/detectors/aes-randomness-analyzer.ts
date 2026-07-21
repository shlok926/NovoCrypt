import { AES_REGEX } from '../utils/regex';

export interface RandomMatch {
  issue: 'WeakRandomness';
  api: string;
  description: string;
  matchedString: string;
}

export class RandomnessAnalyzer {
  public analyzeLine(line: string, astNodes?: any): RandomMatch | null {
    // Audit weak randomness sources (e.g. Math.random(), java.util.Random, Python's random module)
    // Matches: Math.random(), random.random(), random.randint(), new Random()
    const weakRandomRegex = AES_REGEX.WEAK_RANDOM;
    const match = weakRandomRegex.exec(line);
    if (match) {
      return {
        issue: 'WeakRandomness',
        api: match[0],
        description: `Weak pseudorandom number generator (PRNG) API used: "${match[0]}". Predictable values for cryptographic keys, IVs, or salts.`,
        matchedString: match[0]
      };
    }

    return null;
  }
}
