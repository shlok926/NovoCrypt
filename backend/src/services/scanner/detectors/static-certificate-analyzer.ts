import crypto from 'crypto';
import * as forge from 'node-forge';
import * as fs from 'fs/promises';
import { ScanContext, ScanFinding, Evidence } from '../types';
import { ParsedCertificate, TLS_PERFORMANCE_BUDGET } from './tls-types';
import { tlsRules } from './tls-rule-catalog';
import { TelemetryService } from '../../observability';

/**
 * Parses an X.509 certificate from a PEM string.
 */
export function parseX509FromPem(pem: string): ParsedCertificate | null {
  const start = performance.now();
  try {
    const cert = new crypto.X509Certificate(pem);
    
    // Extract Subject Alternative Names
    let sans: string[] = [];
    if (cert.subjectAltName) {
      sans = cert.subjectAltName
        .split(',')
        .map(s => s.trim().replace(/^(DNS|IP|URI|email):/i, ''));
    }
    
    // Extract key algorithm and size
    const key = cert.publicKey;
    const keyAlgorithm = key.asymmetricKeyType || 'unknown';
    let keySize = 0;
    if (key.asymmetricKeyDetails) {
      const details = key.asymmetricKeyDetails;
      if (details.modulusLength) {
        keySize = details.modulusLength;
      } else if (details.namedCurve) {
        const curveMap: Record<string, number> = {
          'P-256': 256, 'secp256r1': 256, 'prime256v1': 256,
          'P-384': 384, 'secp384r1': 384,
          'P-521': 521, 'secp521r1': 521,
          'ed25519': 256, 'x25519': 256
        };
        keySize = curveMap[details.namedCurve] || 256;
      }
    }
    
    // Default fallback parsing via node-forge for advanced properties
    let ocspPresence = false;
    let crlPresence = false;
    let ocspUrls: string[] = [];
    let crlUrls: string[] = [];
    let isCA = cert.ca;
    let pathLenConstraint: number | undefined = undefined;
    let keyUsage: string[] = [];
    let extKeyUsage: string[] = [];
    
    try {
      const forgeCert = forge.pki.certificateFromPem(pem);
      
      // Basic Constraints
      const basicConstraintsExt = forgeCert.getExtension('basicConstraints') as any;
      if (basicConstraintsExt) {
        isCA = basicConstraintsExt.cA || false;
        if (basicConstraintsExt.pathLenConstraint !== undefined) {
          pathLenConstraint = basicConstraintsExt.pathLenConstraint;
        }
      }
      
      // Key Usage
      const keyUsageExt = forgeCert.getExtension('keyUsage') as any;
      if (keyUsageExt) {
        const usages = [
          'digitalSignature', 'nonRepudiation', 'keyEncipherment',
          'dataEncipherment', 'keyAgreement', 'keyCertSign',
          'cRLSign', 'encipherOnly', 'decipherOnly'
        ];
        keyUsage = usages.filter(u => keyUsageExt[u] === true);
      }
      
      // Extended Key Usage
      const extKeyUsageExt = forgeCert.getExtension('extKeyUsage') as any;
      if (extKeyUsageExt) {
        const oids: Record<string, string> = {
          '1.3.6.1.5.5.7.3.1': 'serverAuth',
          '1.3.6.1.5.5.7.3.2': 'clientAuth',
          '1.3.6.1.5.5.7.3.3': 'codeSigning',
          '1.3.6.1.5.5.7.3.4': 'emailProtection',
          '1.3.6.1.5.5.7.3.8': 'timeStamping',
          '1.3.6.1.5.5.7.3.9': 'OCSPSigning'
        };
        for (const oid in oids) {
          if (extKeyUsageExt[oid] === true) {
            extKeyUsage.push(oids[oid]);
          }
        }
        if (extKeyUsageExt.serverAuth) extKeyUsage.push('serverAuth');
        if (extKeyUsageExt.clientAuth) extKeyUsage.push('clientAuth');
        if (extKeyUsageExt.codeSigning) extKeyUsage.push('codeSigning');
        if (extKeyUsageExt.emailProtection) extKeyUsage.push('emailProtection');
      }
      
      // OCSP endpoints
      const aiaExt = forgeCert.getExtension('authorityInfoAccess') as any;
      if (aiaExt && aiaExt.value) {
        const aiaValue = typeof aiaExt.value === 'string' ? aiaExt.value : JSON.stringify(aiaExt.value);
        const ocspRegex = /OCSP\s*-\s*URI:(https?:\/\/[^\s\n\r]+)/gi;
        let match;
        while ((match = ocspRegex.exec(aiaValue)) !== null) {
          ocspUrls.push(match[1]);
        }
        if (ocspUrls.length > 0) ocspPresence = true;
      }
      if (cert.infoAccess) {
        const infoLines = cert.infoAccess.split('\n');
        for (const line of infoLines) {
          if (line.includes('OCSP - URI:')) {
            const url = line.split('OCSP - URI:')[1]?.trim();
            if (url && !ocspUrls.includes(url)) {
              ocspUrls.push(url);
              ocspPresence = true;
            }
          }
        }
      }
      
      // CRL endpoints
      const crlExt = forgeCert.getExtension('crlDistributionPoints') as any;
      if (crlExt) {
        crlPresence = true;
        const crlRegex = /URI:(https?:\/\/[^\s\n\r]+)/gi;
        let match;
        const extValStr = typeof crlExt.value === 'string' ? crlExt.value : JSON.stringify(crlExt.value);
        while ((match = crlRegex.exec(extValStr)) !== null) {
          crlUrls.push(match[1]);
        }
      }
    } catch (e) {
      // Continue with native details if node-forge fails
    }
    
    TelemetryService.recordHistogram('tls.parse.duration.ms', performance.now() - start);
    TelemetryService.recordCounter('tls.certificates.parsed', 1);
    
    return {
      subject: cert.subject,
      issuer: cert.issuer,
      serialNumber: cert.serialNumber,
      sha256Thumbprint: cert.fingerprint256.replace(/:/g, '').toLowerCase(),
      signatureAlgorithm: (cert as any).signatureAlgorithm || 'unknown',
      publicKeyAlgorithm: keyAlgorithm,
      keySize,
      validityStart: new Date(cert.validFrom),
      validityEnd: new Date(cert.validTo),
      subjectAlternativeNames: sans,
      ocspPresence,
      crlPresence,
      ocspUrls,
      crlUrls,
      pem,
      isCA,
      pathLenConstraint,
      keyUsage,
      extKeyUsage
    };
  } catch (error) {
    TelemetryService.recordCounter('tls.certificates.parse_failures', 1);
    return null;
  }
}

/**
 * Parses DER binary certificate data.
 */
export function parseDer(buffer: Buffer): ParsedCertificate | null {
  try {
    const asn1 = forge.asn1.fromDer(buffer.toString('binary'));
    const forgeCert = forge.pki.certificateFromAsn1(asn1);
    const pem = forge.pki.certificateToPem(forgeCert);
    return parseX509FromPem(pem);
  } catch (e) {
    TelemetryService.recordCounter('tls.certificates.parse_failures', 1);
    return null;
  }
}

/**
 * Parses PKCS12/PFX archive files.
 */
export function parsePkcs12(buffer: Buffer): ParsedCertificate[] {
  const certs: ParsedCertificate[] = [];
  const passwords = ['', 'changeit', 'password', 'admin', '123456'];
  
  for (const password of passwords) {
    try {
      const p12Der = forge.asn1.fromDer(buffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Der, password);
      const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBags = bags[forge.pki.oids.certBag] || [];
      
      for (const bag of certBags) {
        if (bag.cert) {
          const pem = forge.pki.certificateToPem(bag.cert);
          const parsed = parseX509FromPem(pem);
          if (parsed) {
            certs.push(parsed);
          }
        }
      }
      if (certs.length > 0) break;
    } catch (e) {
      // Try next password
    }
  }
  return certs;
}

export class StaticCertificateAnalyzer {
  public async analyze(
    context: ScanContext,
    buildFindingFn: (rule: any, evidence: Evidence, confidence: number) => ScanFinding
  ): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const sourceFile = context.fileName || 'unknown_file';
    
    if (context.targetType === 'code' || context.targetType === 'config') {
      const content = context.target;
      if (typeof content !== 'string') return [];
      
      // 1. Check if the file is a known binary certificate file format
      if (context.fileName) {
        const lowerName = context.fileName.toLowerCase();
        if (
          lowerName.endsWith('.p12') ||
          lowerName.endsWith('.pfx') ||
          lowerName.endsWith('.der') ||
          lowerName.endsWith('.cer') ||
          lowerName.endsWith('.crt')
        ) {
          try {
            // Safe filesystem read to get exact binary bytes
            const stat = await fs.stat(context.fileName);
            if (stat.size <= TLS_PERFORMANCE_BUDGET.maxCertificateSizeBytes) {
              const fileBuffer = await fs.readFile(context.fileName);
              
              if (lowerName.endsWith('.p12') || lowerName.endsWith('.pfx')) {
                const parsedCerts = parsePkcs12(fileBuffer);
                for (const cert of parsedCerts) {
                  findings.push(...this.evaluateRules(cert, sourceFile, 1, buildFindingFn));
                }
              } else if (lowerName.endsWith('.der')) {
                const parsed = parseDer(fileBuffer);
                if (parsed) {
                  findings.push(...this.evaluateRules(parsed, sourceFile, 1, buildFindingFn));
                }
              } else {
                // CER / CRT might be PEM or DER, try PEM first then DER
                const text = fileBuffer.toString('utf-8');
                if (text.includes('-----BEGIN CERTIFICATE-----')) {
                  const pemRegex = /-----BEGIN CERTIFICATE-----\s*([A-Za-z0-9+/=\s\r\n]+?)\s*-----END CERTIFICATE-----/g;
                  let match;
                  while ((match = pemRegex.exec(text)) !== null) {
                    const parsed = parseX509FromPem(match[0]);
                    if (parsed) {
                      findings.push(...this.evaluateRules(parsed, sourceFile, 1, buildFindingFn));
                    }
                  }
                } else {
                  const parsed = parseDer(fileBuffer);
                  if (parsed) {
                    findings.push(...this.evaluateRules(parsed, sourceFile, 1, buildFindingFn));
                  }
                }
              }
            }
          } catch (e) {
            // Graceful handling of file read/parse exceptions
          }
        }
      }
      
      // 2. Discover PEM certificate blocks embedded in the content
      const pemRegex = /-----BEGIN CERTIFICATE-----\s*([A-Za-z0-9+/=\s\r\n]+?)\s*-----END CERTIFICATE-----/g;
      let pemMatch;
      while ((pemMatch = pemRegex.exec(content)) !== null) {
        const matchIndex = pemMatch.index;
        const line = content.substring(0, matchIndex).split('\n').length;
        const parsed = parseX509FromPem(pemMatch[0]);
        if (parsed) {
          findings.push(...this.evaluateRules(parsed, sourceFile, line, buildFindingFn, pemMatch[0]));
        }
      }
      
      // 3. Discover embedded Base64 certificate blobs (starting with 'MII')
      // Standard DER certificate base64 begins with MII (represents SEQUENCE asn.1 header)
      const base64Regex = /\b(MII[A-Za-z0-9+/=\r\n]{300,})\b/g;
      let base64Match;
      while ((base64Match = base64Regex.exec(content)) !== null) {
        // Strip newlines or spacing in base64 block
        const b64Str = base64Match[1].replace(/[\s\r\n]/g, '');
        try {
          const buffer = Buffer.from(b64Str, 'base64');
          const parsed = parseDer(buffer);
          if (parsed) {
            const matchIndex = base64Match.index;
            const line = content.substring(0, matchIndex).split('\n').length;
            findings.push(...this.evaluateRules(parsed, sourceFile, line, buildFindingFn, base64Match[0]));
          }
        } catch (e) {
          // Graceful handling of invalid base64 DER attempts
        }
      }
    }
    
    return findings;
  }
  
  private evaluateRules(
    cert: ParsedCertificate,
    sourceFile: string,
    line: number,
    buildFindingFn: (rule: any, evidence: Evidence, confidence: number) => ScanFinding,
    rawMatchSnippet?: string
  ): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const now = new Date();
    
    // Construct default base evidence
    const snippet = rawMatchSnippet 
      ? rawMatchSnippet.substring(0, 300) 
      : `Certificate: Subject="${cert.subject}", Issuer="${cert.issuer}", Serial=${cert.serialNumber}`;
      
    const baseEvidence: Evidence = {
      file: sourceFile,
      line,
      snippet,
      matchedPattern: rawMatchSnippet ? 'Embedded X509 Certificate string' : 'Discovered certificate file',
      qualityScore: 90
    };
    
    // Deterministic base confidence calculation for static parser
    // Max static confidence score is 90
    const staticConfidence = 90;
    
    // Check Expired
    if (now > cert.validityEnd) {
      TelemetryService.recordCounter('tls.expired_certificates', 1);
      findings.push(
        buildFindingFn(
          tlsRules.TLS001,
          {
            ...baseEvidence,
            snippet: `Expired: CN=${cert.subject}. Validity End: ${cert.validityEnd.toISOString()}`
          },
          staticConfidence
        )
      );
    } else {
      // Check Expiring Soon (< 30 days)
      const daysRemaining = (cert.validityEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysRemaining < 30 && daysRemaining >= 0) {
        findings.push(
          buildFindingFn(
            tlsRules.TLS008,
            {
              ...baseEvidence,
              snippet: `CN=${cert.subject} expires in ${Math.round(daysRemaining)} days (${cert.validityEnd.toISOString()})`
            },
            staticConfidence
          )
        );
      }
    }
    
    // Check Not Yet Valid
    if (now < cert.validityStart) {
      findings.push(
        buildFindingFn(
          tlsRules.TLS007,
          {
            ...baseEvidence,
            snippet: `Not Yet Valid: CN=${cert.subject}. Validity Start: ${cert.validityStart.toISOString()}`
          },
          staticConfidence
        )
      );
    }
    
    // Check Weak Signature Algorithm (MD5, SHA-1)
    const sigAlg = cert.signatureAlgorithm.toLowerCase();
    if (sigAlg.includes('md5') || sigAlg.includes('md2') || sigAlg.includes('sha1')) {
      TelemetryService.recordCounter('tls.weak_signatures', 1);
      findings.push(
        buildFindingFn(
          tlsRules.TLS002,
          {
            ...baseEvidence,
            snippet: `Weak Signature Algorithm: ${cert.signatureAlgorithm} found on certificate CN=${cert.subject}`
          },
          staticConfidence
        )
      );
    }
    
    // Check Weak Key Size
    const keyType = cert.publicKeyAlgorithm.toLowerCase();
    if (keyType.includes('rsa')) {
      if (cert.keySize < 2048) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingFn(
            { ...tlsRules.TLS003, severity: 'critical' },
            {
              ...baseEvidence,
              snippet: `Highly insecure RSA key size: ${cert.keySize} bits (less than 2048)`
            },
            staticConfidence
          )
        );
      } else if (cert.keySize === 2048) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingFn(
            { ...tlsRules.TLS003, severity: 'high' },
            {
              ...baseEvidence,
              snippet: `Weak RSA key size: 2048 bits. Classically secure but deprecated.`
            },
            staticConfidence
          )
        );
      } else if (cert.keySize < 3072) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingFn(
            { ...tlsRules.TLS003, severity: 'medium' },
            {
              ...baseEvidence,
              snippet: `Sub-optimal RSA key size: ${cert.keySize} bits (recommended 3072+ for quantum resilience transition).`
            },
            staticConfidence
          )
        );
      }
    } else if (keyType.includes('ec') || keyType.includes('ecdsa')) {
      if (cert.keySize < 256) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingFn(
            tlsRules.TLS003,
            {
              ...baseEvidence,
              snippet: `Weak Elliptic Curve key size: ${cert.keySize} bits (less than 256)`
            },
            staticConfidence
          )
        );
      }
    }
    
    // Check Self-Signed
    const parsedSub = parseCN(cert.subject);
    const parsedIss = parseCN(cert.issuer);
    if (parsedSub && parsedIss && parsedSub === parsedIss) {
      findings.push(
        buildFindingFn(
          tlsRules.TLS006,
          {
            ...baseEvidence,
            snippet: `Self-Signed Certificate: Issuer matches Subject (${parsedSub})`
          },
          staticConfidence
        )
      );
    }
    
    // Check Missing SAN
    if (cert.subjectAlternativeNames.length === 0) {
      TelemetryService.recordCounter('tls.missing_san', 1);
      findings.push(
        buildFindingFn(
          tlsRules.TLS004,
          {
            ...baseEvidence,
            snippet: `Certificate is missing Subject Alternative Names (SAN) extension.`
          },
          staticConfidence
        )
      );
    }
    
    // Check Missing OCSP AIA
    if (!cert.ocspPresence) {
      TelemetryService.recordCounter('tls.missing_ocsp', 1);
      findings.push(
        buildFindingFn(
          tlsRules.TLS009,
          {
            ...baseEvidence,
            snippet: `Certificate lacks Authority Info Access (AIA) OCSP URI extension.`
          },
          staticConfidence
        )
      );
    }
    
    // Check Missing CRL
    if (!cert.crlPresence) {
      TelemetryService.recordCounter('tls.missing_crl', 1);
      findings.push(
        buildFindingFn(
          tlsRules.TLS010,
          {
            ...baseEvidence,
            snippet: `Certificate lacks CRL Distribution Points extension.`
          },
          staticConfidence
        )
      );
    }
    
    // Check Key Usage Extensions (Incorrect Key Usage Extensions)
    // Leaf certificate with basicConstraints CA = true
    if (cert.isCA && !parsedSub.includes('Authority') && !parsedSub.includes('CA') && !parsedSub.includes('Root')) {
      findings.push(
        buildFindingFn(
          tlsRules.TLS014,
          {
            ...baseEvidence,
            snippet: `Basic Constraints CA flag set to true on non-CA/leaf subject certificate CN=${parsedSub}.`
          },
          staticConfidence
        )
      );
    }
    
    // Lacks serverAuth EKU but appears to be server TLS cert
    if (cert.extKeyUsage.length > 0 && !cert.extKeyUsage.includes('serverAuth')) {
      findings.push(
        buildFindingFn(
          tlsRules.TLS014,
          {
            ...baseEvidence,
            snippet: `Certificate defines Extended Key Usage list [${cert.extKeyUsage.join(', ')}] but lacks mandatory serverAuth.`
          },
          staticConfidence
        )
      );
    }
    
    return findings;
  }
}

function parseCN(subjectStr: string): string {
  const cnMatch = /CN\s*=\s*([^,;/]+)/i.exec(subjectStr);
  return cnMatch ? cnMatch[1].trim() : subjectStr;
}
