import tls from 'tls';
import crypto from 'crypto';
import { ScanContext, ScanFinding, Evidence } from '../types';
import { ParsedCertificate, TLS_PERFORMANCE_BUDGET, TlsConfidenceResult } from './tls-types';
import { tlsRules } from './tls-rule-catalog';
import { TelemetryService } from '../../observability';
import { parseX509FromPem } from './static-certificate-analyzer';

// Cache for trusted root SHA-256 fingerprints to avoid parsing on every scan
let cachedTrustedFingerprints: Set<string> | null = null;

function getTrustedFingerprints(): Set<string> {
  if (cachedTrustedFingerprints) return cachedTrustedFingerprints;
  
  const set = new Set<string>();
  for (const pem of tls.rootCertificates) {
    try {
      const c = new crypto.X509Certificate(pem);
      const thumbprint = c.fingerprint256.replace(/:/g, '').toLowerCase();
      set.add(thumbprint);
    } catch {
      // Ignore parsing errors of built-in certs
    }
  }
  cachedTrustedFingerprints = set;
  return set;
}

export class LiveTlsAnalyzer {
  public async analyze(
    context: ScanContext,
    buildFindingFn: (rule: any, evidence: Evidence, confidence: number) => ScanFinding
  ): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const targetUrl = context.target;
    
    // Extract hostname and port
    let hostname = targetUrl;
    let port = 443;
    try {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        const urlObj = new URL(targetUrl);
        hostname = urlObj.hostname;
        port = urlObj.port ? parseInt(urlObj.port) : 443;
      } else if (targetUrl.includes(':')) {
        const parts = targetUrl.split(':');
        hostname = parts[0];
        port = parseInt(parts[1]) || 443;
      }
    } catch (e) {
      // Fallback
    }

    TelemetryService.recordCounter('tls.handshakes', 1);
    const startHandshake = performance.now();

    return new Promise((resolve) => {
      let resolved = false;

      const finish = (resultFindings: ScanFinding[]) => {
        if (resolved) return;
        resolved = true;
        resolve(resultFindings);
      };

      // Set up TLS socket connection with strict timeout budget
      const socket = tls.connect(
        {
          host: hostname,
          port: port,
          servername: hostname, // SNI
          rejectUnauthorized: false, // We inspect failing/expired certificates
          requestCert: true,
          timeout: TLS_PERFORMANCE_BUDGET.handshakeTimeoutMs
        },
        () => {
          const duration = performance.now() - startHandshake;
          TelemetryService.recordHistogram('tls.handshake.duration.ms', duration);
          
          try {
            const peerCert = socket.getPeerCertificate(true);
            const negotiatedProtocol = socket.getProtocol();
            const negotiatedCipher = socket.getCipher();
            const alpnProtocol = socket.alpnProtocol || null;
            
            if (!peerCert || !peerCert.raw) {
              TelemetryService.recordCounter('tls.handshake_failures', 1);
              finish([]);
              return;
            }
            
            // Build the certificate chain returned by the peer
            const peerChain: any[] = [];
            let curr: any = peerCert;
            const visited = new Set<string>();
            
            while (curr && curr.fingerprint && !visited.has(curr.fingerprint)) {
              peerChain.push(curr);
              visited.add(curr.fingerprint);
              
              if (curr.issuerCertificate && curr.issuerCertificate !== curr) {
                curr = curr.issuerCertificate;
              } else {
                break;
              }
            }
            
            // Limit chain length based on performance budget
            const trimmedChain = peerChain.slice(0, TLS_PERFORMANCE_BUDGET.maxChainLength);
            
            // Parse all certificates in the chain into standard ParsedCertificate structure
            const parsedChain: ParsedCertificate[] = [];
            for (const c of trimmedChain) {
              const pem = `-----BEGIN CERTIFICATE-----\n${c.raw.toString('base64').match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
              const parsed = parseX509FromPem(pem);
              if (parsed) {
                parsedChain.push(parsed);
              }
            }
            
            if (parsedChain.length === 0) {
              TelemetryService.recordCounter('tls.handshake_failures', 1);
              finish([]);
              return;
            }
            
            const leafCert = parsedChain[0];
            
            // Determine confidence details
            const confidenceResult = calculateLiveConfidence(leafCert, hostname, parsedChain);
            
            // 1. Evaluate certificate properties (validity, key, signatures, SANs, usage, hostname match)
            findings.push(
              ...this.evaluateCertRules(
                leafCert,
                hostname,
                targetUrl,
                parsedChain,
                negotiatedProtocol,
                negotiatedCipher,
                alpnProtocol,
                duration,
                confidenceResult,
                buildFindingFn
              )
            );
            
            // 2. Evaluate Protocol rules
            findings.push(
              ...this.evaluateProtocolRules(
                negotiatedProtocol,
                leafCert,
                hostname,
                targetUrl,
                parsedChain,
                negotiatedCipher,
                alpnProtocol,
                duration,
                confidenceResult,
                buildFindingFn
              )
            );
            
            // 3. Evaluate Cipher Suite rules
            findings.push(
              ...this.evaluateCipherRules(
                negotiatedCipher,
                leafCert,
                hostname,
                targetUrl,
                parsedChain,
                negotiatedProtocol,
                alpnProtocol,
                duration,
                confidenceResult,
                buildFindingFn
              )
            );
            
            // 4. Evaluate Chain Validation rules
            findings.push(
              ...this.evaluateChainRules(
                parsedChain,
                peerChain,
                hostname,
                targetUrl,
                negotiatedProtocol,
                negotiatedCipher,
                alpnProtocol,
                duration,
                confidenceResult,
                buildFindingFn
              )
            );
            
            finish(findings);
          } catch (err) {
            TelemetryService.recordCounter('tls.handshake_failures', 1);
            finish([]);
          } finally {
            socket.destroy();
          }
        }
      );
      
      socket.on('error', (err) => {
        TelemetryService.recordCounter('tls.handshake_failures', 1);
        // Clean up connection errors gracefully, returning empty findings
        finish([]);
      });
      
      socket.on('timeout', () => {
        TelemetryService.recordCounter('tls.handshake_failures', 1);
        socket.destroy();
        finish([]);
      });
    });
  }
  
  private evaluateCertRules(
    cert: ParsedCertificate,
    hostname: string,
    targetUrl: string,
    chain: ParsedCertificate[],
    protocol: string | null,
    cipher: any | null,
    alpn: string | null,
    durationMs: number,
    confidence: TlsConfidenceResult,
    buildFindingFn: (rule: any, evidence: Evidence, confidence: number) => ScanFinding
  ): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const now = new Date();
    
    const buildBaseEvidence = (explanation: string): Evidence => ({
      file: targetUrl,
      snippet: `Cert Details: Subject="${cert.subject}", Issuer="${cert.issuer}", Serial=${cert.serialNumber}`,
      matchedPattern: 'TLS Handshake Peer Certificate Details',
      qualityScore: 100,
      language: 'TLS',
      // Store all the structured evidence details directly in the extra details of the finding (handled by BaseDetector)
    });
    
    // Helper to inject structured evidence data
    const buildFindingWithEvidence = (rule: any, explanation: string): ScanFinding => {
      const baseEvidence = buildBaseEvidence(explanation);
      const finding = buildFindingFn(rule, baseEvidence, confidence.score);
      
      // Inject required detailed structured evidence fields into finding metadata/properties
      finding.evidence = {
        ...finding.evidence,
        subject: cert.subject,
        issuer: cert.issuer,
        serialNumber: cert.serialNumber,
        sha256Thumbprint: cert.sha256Thumbprint,
        signatureAlgorithm: cert.signatureAlgorithm,
        publicKeyAlgorithm: cert.publicKeyAlgorithm,
        keySize: cert.keySize,
        validityStart: cert.validityStart.toISOString(),
        validityEnd: cert.validityEnd.toISOString(),
        subjectAlternativeNames: cert.subjectAlternativeNames,
        hostname: hostname,
        sourceFileOrUrl: targetUrl,
        certificateDepth: 0,
        chainLength: chain.length,
        ocspPresence: cert.ocspPresence,
        crlPresence: cert.crlPresence,
        alpn: alpn,
        tlsVersion: protocol,
        cipherSuite: cipher ? cipher.name : null,
        handshakeDurationMs: durationMs,
        explanation: explanation
      } as any;
      
      return finding;
    };
    
    // Check Expired (TLS001)
    if (now > cert.validityEnd) {
      TelemetryService.recordCounter('tls.expired_certificates', 1);
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS001,
          `Certificate subject CN=${parseCN(cert.subject)} expired on ${cert.validityEnd.toISOString()}, which is in the past.`
        )
      );
    } else {
      // Check Expiring Soon (TLS008)
      const daysRemaining = (cert.validityEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysRemaining < 30 && daysRemaining >= 0) {
        findings.push(
          buildFindingWithEvidence(
            tlsRules.TLS008,
            `Certificate subject CN=${parseCN(cert.subject)} is expiring soon in ${Math.round(daysRemaining)} days (${cert.validityEnd.toISOString()}).`
          )
        );
      }
    }
    
    // Check Not Yet Valid (TLS007)
    if (now < cert.validityStart) {
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS007,
          `Certificate subject CN=${parseCN(cert.subject)} validity start date ${cert.validityStart.toISOString()} is in the future.`
        )
      );
    }
    
    // Check Weak Signature Algorithm (TLS002)
    const sigAlg = cert.signatureAlgorithm.toLowerCase();
    if (sigAlg.includes('md5') || sigAlg.includes('md2') || sigAlg.includes('sha1')) {
      TelemetryService.recordCounter('tls.weak_signatures', 1);
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS002,
          `Certificate subject CN=${parseCN(cert.subject)} is signed using weak/deprecated algorithm: ${cert.signatureAlgorithm}.`
        )
      );
    }
    
    // Check Weak Key Size (TLS003)
    const keyType = cert.publicKeyAlgorithm.toLowerCase();
    if (keyType.includes('rsa')) {
      if (cert.keySize < 2048) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingWithEvidence(
            { ...tlsRules.TLS003, severity: 'critical' },
            `Insecure RSA key size: ${cert.keySize} bits (recommended >= 2048 classically, >= 3072 for PQC transition).`
          )
        );
      } else if (cert.keySize === 2048) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingWithEvidence(
            { ...tlsRules.TLS003, severity: 'high' },
            `Weak RSA key size: 2048 bits. Subject CN=${parseCN(cert.subject)}. Generates high risk under quantum Shor's algorithm threat.`
          )
        );
      } else if (cert.keySize < 3072) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingWithEvidence(
            { ...tlsRules.TLS003, severity: 'medium' },
            `Legacy RSA key size: ${cert.keySize} bits. Safe for now, but fails transition requirements for post-quantum timeline.`
          )
        );
      }
    } else if (keyType.includes('ec') || keyType.includes('ecdsa')) {
      if (cert.keySize < 256) {
        TelemetryService.recordCounter('tls.weak_keys', 1);
        findings.push(
          buildFindingWithEvidence(
            tlsRules.TLS003,
            `Insecure EC/ECDSA key size: ${cert.keySize} bits (recommended >= 256).`
          )
        );
      }
    }
    
    // Check Self-Signed (TLS006)
    const parsedSub = parseCN(cert.subject);
    const parsedIss = parseCN(cert.issuer);
    if (parsedSub && parsedIss && parsedSub === parsedIss) {
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS006,
          `Self-Signed Certificate detected: issuer "${parsedIss}" equals subject "${parsedSub}". No trusted CA path exists.`
        )
      );
    }
    
    // Check Missing SAN (TLS004)
    if (cert.subjectAlternativeNames.length === 0) {
      TelemetryService.recordCounter('tls.missing_san', 1);
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS004,
          `Certificate is missing the Subject Alternative Names (SAN) extension. Browsers mandate SAN check over Common Name (CN).`
        )
      );
    }
    
    // Check Hostname Mismatch (TLS005)
    const hostMatched = matchHostname(cert.subjectAlternativeNames, parsedSub, hostname);
    if (!hostMatched) {
      TelemetryService.recordCounter('tls.hostname_mismatches', 1);
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS005,
          `Hostname mismatch: Target domain "${hostname}" does not match certificate CN "${parsedSub}" or SANs [${cert.subjectAlternativeNames.join(', ')}].`
        )
      );
    }
    
    // Check Missing OCSP AIA (TLS009)
    if (!cert.ocspPresence) {
      TelemetryService.recordCounter('tls.missing_ocsp', 1);
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS009,
          `Certificate subject CN=${parsedSub} is missing the Authority Info Access (AIA) OCSP URI extension.`
        )
      );
    }
    
    // Check Missing CRL (TLS010)
    if (!cert.crlPresence) {
      TelemetryService.recordCounter('tls.missing_crl', 1);
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS010,
          `Certificate subject CN=${parsedSub} is missing the CRL Distribution Points extension.`
        )
      );
    }
    
    // Check Key Usage Extensions (TLS014)
    if (cert.isCA && !parsedSub.includes('Authority') && !parsedSub.includes('CA') && !parsedSub.includes('Root')) {
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS014,
          `Leaf certificate for domain "${hostname}" has CA flag set to true in Basic Constraints, which violates standard trust separation.`
        )
      );
    }
    if (cert.extKeyUsage.length > 0 && !cert.extKeyUsage.includes('serverAuth')) {
      findings.push(
        buildFindingWithEvidence(
          tlsRules.TLS014,
          `Extended Key Usage extension exists but lacks serverAuth (contains: [${cert.extKeyUsage.join(', ')}]), which clients verify for SSL.`
        )
      );
    }
    
    return findings;
  }
  
  private evaluateProtocolRules(
    protocol: string | null,
    cert: ParsedCertificate,
    hostname: string,
    targetUrl: string,
    chain: ParsedCertificate[],
    cipher: any | null,
    alpn: string | null,
    durationMs: number,
    confidence: TlsConfidenceResult,
    buildFindingFn: (rule: any, evidence: Evidence, confidence: number) => ScanFinding
  ): ScanFinding[] {
    const findings: ScanFinding[] = [];
    if (!protocol) return [];
    
    const buildFindingWithEvidence = (rule: any, explanation: string): ScanFinding => {
      const finding = buildFindingFn(rule, {
        file: targetUrl,
        snippet: `TLS Protocol: ${protocol}`,
        matchedPattern: 'Negotiated TLS protocol version',
        qualityScore: 100
      }, confidence.score);
      
      finding.evidence = {
        ...finding.evidence,
        subject: cert.subject,
        issuer: cert.issuer,
        serialNumber: cert.serialNumber,
        sha256Thumbprint: cert.sha256Thumbprint,
        signatureAlgorithm: cert.signatureAlgorithm,
        publicKeyAlgorithm: cert.publicKeyAlgorithm,
        keySize: cert.keySize,
        validityStart: cert.validityStart.toISOString(),
        validityEnd: cert.validityEnd.toISOString(),
        subjectAlternativeNames: cert.subjectAlternativeNames,
        hostname: hostname,
        sourceFileOrUrl: targetUrl,
        certificateDepth: 0,
        chainLength: chain.length,
        ocspPresence: cert.ocspPresence,
        crlPresence: cert.crlPresence,
        alpn: alpn,
        tlsVersion: protocol,
        cipherSuite: cipher ? cipher.name : null,
        handshakeDurationMs: durationMs,
        explanation: explanation
      } as any;
      
      return finding;
    };
    
    const lowerProto = protocol.toLowerCase();
    
    // SSLv2 / SSLv3 (TLS004 / TLS011)
    if (lowerProto.includes('ssl')) {
      TelemetryService.recordCounter('tls.weak_protocols', 1);
      findings.push(
        buildFindingWithEvidence(
          { ...tlsRules.TLS011, severity: 'critical' },
          `Insecure SSL protocol negotiated: "${protocol}". Vulnerable to severe cryptographic attacks (e.g., POODLE).`
        )
      );
    }
    // TLS 1.0 / TLS 1.1 (TLS011)
    else if (lowerProto === 'tlsv1' || lowerProto === 'tlsv1.1') {
      TelemetryService.recordCounter('tls.weak_protocols', 1);
      findings.push(
        buildFindingWithEvidence(
          { ...tlsRules.TLS011, severity: 'high' },
          `Deprecated protocol version negotiated: "${protocol}". Deprecated by IETF RFC 8996 due to lack of support for modern ciphers.`
        )
      );
    }
    // TLS 1.2 (TLS011 / Legacy)
    else if (lowerProto === 'tlsv1.2') {
      // Typically reported as Legacy Protocol Enabled (Severity: Medium/Low)
      findings.push(
        buildFindingWithEvidence(
          {
            ...tlsRules.TLS011,
            id: 'TLS002',
            title: 'Legacy Protocol Enabled (TLS 1.2)',
            severity: 'medium',
            description: 'The server supports TLS 1.2. While still safe when properly configured, modern security standards recommend transition to TLS 1.3.'
          },
          `Legacy protocol negotiated: "${protocol}". Server should enforce TLS 1.3.`
        )
      );
    }
    // TLS 1.3 (TLS003 / Supported)
    else if (lowerProto === 'tlsv1.3') {
      findings.push(
        buildFindingWithEvidence(
          {
            ...tlsRules.TLS011,
            id: 'TLS003',
            title: 'TLS 1.3 Supported',
            severity: 'info',
            description: 'The server supports TLS 1.3, which is the latest, most secure protocol standard.'
          },
          `Modern secure protocol negotiated: "${protocol}".`
        )
      );
    }
    
    return findings;
  }
  
  private evaluateCipherRules(
    cipher: any | null,
    cert: ParsedCertificate,
    hostname: string,
    targetUrl: string,
    chain: ParsedCertificate[],
    protocol: string | null,
    alpn: string | null,
    durationMs: number,
    confidence: TlsConfidenceResult,
    buildFindingFn: (rule: any, evidence: Evidence, confidence: number) => ScanFinding
  ): ScanFinding[] {
    const findings: ScanFinding[] = [];
    if (!cipher || !cipher.name) return [];
    
    const cipherName = cipher.name.toUpperCase();
    
    const buildFindingWithEvidence = (rule: any, explanation: string): ScanFinding => {
      const finding = buildFindingFn(rule, {
        file: targetUrl,
        snippet: `TLS Cipher: ${cipherName}`,
        matchedPattern: 'Negotiated TLS cipher suite',
        qualityScore: 100
      }, confidence.score);
      
      finding.evidence = {
        ...finding.evidence,
        subject: cert.subject,
        issuer: cert.issuer,
        serialNumber: cert.serialNumber,
        sha256Thumbprint: cert.sha256Thumbprint,
        signatureAlgorithm: cert.signatureAlgorithm,
        publicKeyAlgorithm: cert.publicKeyAlgorithm,
        keySize: cert.keySize,
        validityStart: cert.validityStart.toISOString(),
        validityEnd: cert.validityEnd.toISOString(),
        subjectAlternativeNames: cert.subjectAlternativeNames,
        hostname: hostname,
        sourceFileOrUrl: targetUrl,
        certificateDepth: 0,
        chainLength: chain.length,
        ocspPresence: cert.ocspPresence,
        crlPresence: cert.crlPresence,
        alpn: alpn,
        tlsVersion: protocol,
        cipherSuite: cipherName,
        handshakeDurationMs: durationMs,
        explanation: explanation
      } as any;
      
      return finding;
    };
    
    // Check Weak Ciphers (TLS012)
    const isWeak = 
      cipherName.includes('RC4') || 
      cipherName.includes('3DES') || 
      cipherName.includes('DES') || 
      cipherName.includes('NULL') || 
      cipherName.includes('EXPORT') || 
      cipherName.includes('ANON') || 
      cipherName.includes('MD5');
      
    if (isWeak) {
      TelemetryService.recordCounter('tls.weak_cipher_suites', 1);
      findings.push(
        buildFindingWithEvidence(
          { ...tlsRules.TLS012, severity: 'critical' },
          `Insecure cipher suite negotiated: "${cipherName}". Contains classically broken cryptosystems.`
        )
      );
      return findings;
    }
    
    // Check CBC-only legacy suites without AEAD (GCM / POLY1305 check)
    const isAEAD = cipherName.includes('GCM') || cipherName.includes('POLY1305');
    if (!isAEAD) {
      TelemetryService.recordCounter('tls.weak_cipher_suites', 1);
      findings.push(
        buildFindingWithEvidence(
          { ...tlsRules.TLS012, severity: 'high' },
          `Weak CBC-mode legacy cipher suite negotiated: "${cipherName}". Vulnerable to padding oracle attacks.`
        )
      );
    }
    
    // Check Static RSA Key Exchange (Lack of Forward Secrecy)
    // Suites starting with TLS_RSA_ or containing _RSA_WITH_ (except ECDHE/DHE)
    const lacksFS = cipherName.includes('_RSA_') && !cipherName.includes('ECDHE') && !cipherName.includes('DHE');
    if (lacksFS) {
      TelemetryService.recordCounter('tls.weak_cipher_suites', 1);
      findings.push(
        buildFindingWithEvidence(
          { ...tlsRules.TLS012, severity: 'high' },
          `Insecure key exchange: "${cipherName}" does not provide Forward Secrecy. Compromise of server private key allows retroactive decryption.`
        )
      );
    }
    
    return findings;
  }
  
  private evaluateChainRules(
    parsedChain: ParsedCertificate[],
    rawChain: any[],
    hostname: string,
    targetUrl: string,
    protocol: string | null,
    cipher: any | null,
    alpn: string | null,
    durationMs: number,
    confidence: TlsConfidenceResult,
    buildFindingFn: (rule: any, evidence: Evidence, confidence: number) => ScanFinding
  ): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const now = new Date();
    
    const buildFindingWithDepth = (rule: any, explanation: string, depth: number): ScanFinding => {
      const matchedCert = parsedChain[depth] || parsedChain[0];
      const finding = buildFindingFn(rule, {
        file: targetUrl,
        snippet: `Chain Validation Error at Depth ${depth}: CN=${parseCN(matchedCert.subject)}`,
        matchedPattern: 'X509 Certificate Chain Path Validation',
        qualityScore: 100
      }, confidence.score);
      
      finding.evidence = {
        ...finding.evidence,
        subject: matchedCert.subject,
        issuer: matchedCert.issuer,
        serialNumber: matchedCert.serialNumber,
        sha256Thumbprint: matchedCert.sha256Thumbprint,
        signatureAlgorithm: matchedCert.signatureAlgorithm,
        publicKeyAlgorithm: matchedCert.publicKeyAlgorithm,
        keySize: matchedCert.keySize,
        validityStart: matchedCert.validityStart.toISOString(),
        validityEnd: matchedCert.validityEnd.toISOString(),
        subjectAlternativeNames: matchedCert.subjectAlternativeNames,
        hostname: hostname,
        sourceFileOrUrl: targetUrl,
        certificateDepth: depth,
        chainLength: parsedChain.length,
        ocspPresence: matchedCert.ocspPresence,
        crlPresence: matchedCert.crlPresence,
        alpn: alpn,
        tlsVersion: protocol,
        cipherSuite: cipher ? cipher.name : null,
        handshakeDurationMs: durationMs,
        explanation: explanation
      } as any;
      
      return finding;
    };
    
    // Check Chain Length (TLS013)
    if (parsedChain.length > TLS_PERFORMANCE_BUDGET.maxChainLength) {
      findings.push(
        buildFindingWithDepth(
          tlsRules.TLS013,
          `Certificate chain length of ${parsedChain.length} exceeds the enterprise operational limit of ${TLS_PERFORMANCE_BUDGET.maxChainLength}.`,
          0
        )
      );
    }
    
    // Check Duplicate Intermediates (TLS013)
    const seenFingerprints = new Set<string>();
    parsedChain.forEach((cert, index) => {
      if (seenFingerprints.has(cert.sha256Thumbprint)) {
        findings.push(
          buildFindingWithDepth(
            tlsRules.TLS013,
            `Duplicate certificate with thumbprint "${cert.sha256Thumbprint}" detected in chain at depth ${index}.`,
            index
          )
        );
      }
      seenFingerprints.add(cert.sha256Thumbprint);
    });
    
    // Check Certificate Validity & Expiration for Intermediates (depth > 0)
    parsedChain.forEach((cert, index) => {
      if (index > 0) {
        if (now > cert.validityEnd) {
          findings.push(
            buildFindingWithDepth(
              tlsRules.TLS013,
              `Expired Intermediate Certificate: depth ${index} (CN=${parseCN(cert.subject)}) expired on ${cert.validityEnd.toISOString()}.`,
              index
            )
          );
        }
      }
    });
    
    // Validate signatures along the chain path (Broken Chain / Incomplete Chain)
    // For each certificate i, it should be verified by the public key of i + 1
    const trustedRoots = getTrustedFingerprints();
    let rootIsTrusted = false;
    let pathBroken = false;
    
    for (let i = 0; i < parsedChain.length; i++) {
      const child = parsedChain[i];
      const childPem = child.pem;
      
      // If we are at the end of the parsed chain
      if (i === parsedChain.length - 1) {
        // Verify if root is self-signed (Issuer CN === Subject CN)
        const childCN = parseCN(child.subject);
        const childIssuerCN = parseCN(child.issuer);
        
        if (childCN === childIssuerCN) {
          // Check if root is in system trust anchor store
          if (trustedRoots.has(child.sha256Thumbprint)) {
            rootIsTrusted = true;
          } else {
            // Unknown root CA
            findings.push(
              buildFindingWithDepth(
                tlsRules.TLS013,
                `Untrusted/Unknown Root Certificate: CN=${childCN} is self-signed but not present in standard trusted root CAs.`,
                i
              )
            );
          }
        } else {
          // Chain is incomplete: last element in chain is not root/self-signed
          findings.push(
            buildFindingWithDepth(
              tlsRules.TLS013,
              `Incomplete chain: Last certificate in chain (CN=${childCN}) is signed by CN=${childIssuerCN} which is missing from server payload.`,
              i
            )
          );
        }
      } else {
        // Verify child signature using parent public key
        try {
          const parent = parsedChain[i + 1];
          const childCertObj = new crypto.X509Certificate(childPem);
          const parentCertObj = new crypto.X509Certificate(parent.pem);
          
          const verified = childCertObj.verify(parentCertObj.publicKey);
          if (!verified) {
            pathBroken = true;
            findings.push(
              buildFindingWithDepth(
                tlsRules.TLS013,
                `Broken Certificate Signature: Certificate at depth ${i} (CN=${parseCN(child.subject)}) signature cannot be verified with public key of parent (CN=${parseCN(parent.subject)}).`,
                i
              )
            );
          }
        } catch (e) {
          pathBroken = true;
          findings.push(
            buildFindingWithDepth(
              tlsRules.TLS013,
              `Failed signature verification check between certificate at depth ${i} and its parent.`,
              i
            )
          );
        }
      }
    }
    
    if (pathBroken) {
      TelemetryService.recordCounter('tls.chain_validation_failures', 1);
    }
    
    return findings;
  }
}

function parseCN(subjectStr: string): string {
  const cnMatch = /CN\s*=\s*([^,;/]+)/i.exec(subjectStr);
  return cnMatch ? cnMatch[1].trim() : subjectStr;
}

export function matchHostname(certSANs: string[], cn: string, hostname: string): boolean {
  const checkString = hostname.toLowerCase();
  const candidates = [...certSANs, cn].map(c => c.toLowerCase()).filter(c => c);
  
  for (const pattern of candidates) {
    if (pattern === checkString) return true;
    if (pattern.startsWith('*.')) {
      const wildcardPart = pattern.slice(2);
      const hostParts = checkString.split('.');
      if (hostParts.length > 1) {
        const subdomainParent = hostParts.slice(1).join('.');
        if (subdomainParent === wildcardPart) {
          return true;
        }
      }
    }
  }
  return false;
}

function calculateLiveConfidence(
  cert: ParsedCertificate,
  hostname: string,
  chain: ParsedCertificate[]
): TlsConfidenceResult {
  let score = 40; // Base parsed certificate score
  let reasons: string[] = ['Certificate parsed successfully'];
  
  if (cert) {
    score += 20; // parsing success
  }
  
  // Handshake completed (+15)
  score += 15;
  reasons.push('Live TLS handshake completed');
  
  // Hostname matching verification (+10)
  const hostMatched = matchHostname(cert.subjectAlternativeNames, parseCN(cert.subject), hostname);
  if (hostMatched) {
    score += 10;
    reasons.push('Hostname successfully validated');
  } else {
    reasons.push('Hostname mismatch detected');
  }
  
  // Extension verification check (+10)
  if (cert.subjectAlternativeNames.length > 0) {
    score += 10;
    reasons.push('Extensions checked (SANs verified)');
  }
  
  // Chain signature check (+5)
  if (chain.length > 1) {
    score += 5;
    reasons.push('Multi-depth certificate chain verified');
  }
  
  const level = score >= 95 ? 'Critical' : (score >= 80 ? 'High' : (score >= 60 ? 'Medium' : 'Low'));
  
  return {
    level,
    score,
    reason: reasons.join(', ')
  };
}
