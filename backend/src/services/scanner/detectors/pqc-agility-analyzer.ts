import { AgilityClassification } from './pqc-types';
import { PQC_REGEX } from '../utils/regex';

export interface AgilityMatch {
  classification: AgilityClassification;
  api: string;
  description: string;
  matchedString: string;
}

export class CryptoAgilityAnalyzer {
  public analyzeLine(line: string, astNodes?: any): AgilityMatch | null {
    // 1. Fully Crypto Agile patterns
    // e.g. CryptographicFactory, CryptoProviderRegistry, algorithmProvider.get(), failoverProvider, pluggableKEM
    const agileRegex = PQC_REGEX.AGILE_FACTORY;
    const agileMatch = agileRegex.exec(line);
    if (agileMatch) {
      return {
        classification: 'Fully Crypto Agile',
        api: agileMatch[0],
        description: `Cryptographic agility detected: uses factory, failover, or abstraction pattern (${agileMatch[0]}).`,
        matchedString: agileMatch[0]
      };
    }

    // 2. Semi-Agile patterns
    // e.g. read algorithm from environment variables or configs: process.env.CRYPTO_ALG, config.get('algorithm')
    const semiAgileRegex = PQC_REGEX.SEMI_AGILE;
    const semiMatch = semiAgileRegex.exec(line);
    if (semiMatch) {
      return {
        classification: 'Semi-Agile',
        api: semiMatch[0],
        description: `Semi-agile architecture detected: algorithm selected from configuration/environment variables (${semiMatch[0]}).`,
        matchedString: semiMatch[0]
      };
    }

    // Static Crypto is usually the fallback/default when neither is present in files, but we can detect hardcoded settings to label it
    const staticCrypto = PQC_REGEX.STATIC_CRYPTO;
    const staticMatch = staticCrypto.exec(line);
    if (staticMatch) {
      return {
        classification: 'Static Crypto',
        api: staticMatch[0],
        description: `Static cryptographic assignment detected: hardcoded algorithm parameters ("${staticMatch[0]}").`,
        matchedString: staticMatch[0]
      };
    }

    return null;
  }
}
