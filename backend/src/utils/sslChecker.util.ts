import * as forge from 'node-forge';
import https from 'https';
import tls from 'tls';

export interface SSLCertificate {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  keyAlgorithm: string;
  keySize: number;
  fingerprint: string;
  tlsVersion?: string;
  cipherSuite?: string;
}

export interface SSLVulnerability {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  recommendation: string;
  quantumBreakable: boolean;
  estimatedBreakTime?: string;
}

/**
 * Fetch SSL certificate from a URL
 */
export async function fetchSSLCertificate(url: string): Promise<SSLCertificate | null> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      const req = https.request(
        {
          host: hostname,
          port: 443,
          method: 'HEAD',
        },
        (res) => {
          const socket = res.socket as tls.TLSSocket;
          const cert = socket?.getPeerCertificate();
          if (!cert) {
            resolve(null);
            return;
          }

          const pem = socket?.getPeerCertificate(false) as any;
          
          const subjectCN = Array.isArray(cert.subject?.CN) ? cert.subject.CN[0] : cert.subject?.CN;
          const issuerCN = Array.isArray(cert.issuer?.CN) ? cert.issuer.CN[0] : cert.issuer?.CN;
          
          resolve({
            subject: subjectCN || 'Unknown',
            issuer: issuerCN || 'Unknown',
            validFrom: new Date(cert.valid_from),
            validTo: new Date(cert.valid_to),
            keyAlgorithm: (cert as any).asymmetricKeyType || 'Unknown',
            keySize: ((cert as any).asymmetricKeySize || 0) * 8,
            fingerprint: cert.fingerprint || '',
          });

          res.on('data', () => {});
        }
      );

      req.on('error', () => {
        resolve(null);
      });

      req.end();

      setTimeout(() => {
        resolve(null);
      }, 5000);
    } catch (error) {
      resolve(null);
    }
  });
}

/**
 * Analyze SSL certificate for vulnerabilities
 */
export async function analyzeSSLCertificate(url: string): Promise<SSLVulnerability[]> {
  const vulnerabilities: SSLVulnerability[] = [];
  const cert = await fetchSSLCertificate(url);

  if (!cert) {
    vulnerabilities.push({
      id: 'ssl_fetch_failed',
      type: 'CONNECTION_ERROR',
      severity: 'high',
      description: 'Could not fetch SSL certificate from the URL',
      location: url,
      recommendation: 'Verify the URL is correct and accessible',
      quantumBreakable: false,
    });
    return vulnerabilities;
  }

  // Check key algorithm
  if (cert.keyAlgorithm === 'rsa' && cert.keySize < 2048) {
    vulnerabilities.push({
      id: 'rsa_weak_key',
      type: 'RSA_WEAK_KEY',
      severity: 'critical',
      description: `RSA-${cert.keySize} found. Vulnerable to quantum attacks.`,
      location: `${url} (SSL Certificate)`,
      recommendation: 'Upgrade to RSA-4096 or migrate to CRYSTALS-Kyber',
      quantumBreakable: true,
      estimatedBreakTime: '< 1 year with quantum computer',
    });
  } else if (cert.keyAlgorithm === 'rsa' && cert.keySize === 2048) {
    vulnerabilities.push({
      id: 'rsa_moderate_risk',
      type: 'RSA_MODERATE_RISK',
      severity: 'high',
      description: `RSA-${cert.keySize} found. Moderate quantum risk.`,
      location: `${url} (SSL Certificate)`,
      recommendation: 'Plan migration to post-quantum algorithms (CRYSTALS-Kyber)',
      quantumBreakable: true,
      estimatedBreakTime: '5-10 years with quantum computer',
    });
  } else if (cert.keyAlgorithm === 'ec' && cert.keySize < 384) {
    vulnerabilities.push({
      id: 'ec_weak_key',
      type: 'EC_WEAK_KEY',
      severity: 'medium',
      description: `ECC-${cert.keySize} found. Vulnerable to advanced quantum attacks.`,
      location: `${url} (SSL Certificate)`,
      recommendation: 'Use ECC-384 or higher, consider post-quantum alternatives',
      quantumBreakable: true,
      estimatedBreakTime: '10-20 years',
    });
  }

  // Check certificate expiration
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    vulnerabilities.push({
      id: 'cert_expired',
      type: 'CERTIFICATE_EXPIRED',
      severity: 'critical',
      description: 'SSL certificate has expired',
      location: url,
      recommendation: 'Renew the SSL certificate immediately',
      quantumBreakable: false,
    });
  } else if (daysUntilExpiry < 30) {
    vulnerabilities.push({
      id: 'cert_expiring_soon',
      type: 'CERTIFICATE_EXPIRING',
      severity: 'high',
      description: `SSL certificate expires in ${daysUntilExpiry} days`,
      location: url,
      recommendation: 'Renew the SSL certificate within the next 30 days',
      quantumBreakable: false,
    });
  }

  return vulnerabilities;
}

/**
 * Check multiple URLs for SSL vulnerabilities
 */
export async function batchAnalyzeSSL(urls: string[]): Promise<Record<string, SSLVulnerability[]>> {
  const results: Record<string, SSLVulnerability[]> = {};

  for (const url of urls) {
    try {
      results[url] = await analyzeSSLCertificate(url);
    } catch (error) {
      results[url] = [
        {
          id: 'analysis_error',
          type: 'ANALYSIS_ERROR',
          severity: 'high',
          description: 'Error analyzing SSL certificate',
          location: url,
          recommendation: 'Try again or contact support',
          quantumBreakable: false,
        },
      ];
    }
  }

  return results;
}

/**
 * Get human-readable TLS version assessment
 */
export function assessTLSVersion(version: string): {
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
} {
  const assessments: Record<string, any> = {
    'TLSv1.0': {
      severity: 'critical',
      recommendation: 'Disable TLS 1.0 immediately. Use TLS 1.3 or 1.2.',
    },
    'TLSv1.1': {
      severity: 'critical',
      recommendation: 'Disable TLS 1.1 immediately. Use TLS 1.3 or 1.2.',
    },
    'TLSv1.2': {
      severity: 'medium',
      recommendation: 'TLS 1.2 is acceptable. Upgrade to TLS 1.3 when possible.',
    },
    'TLSv1.3': {
      severity: 'low',
      recommendation: 'TLS 1.3 is secure and modern. Maintain current configuration.',
    },
  };

  return assessments[version] || {
    severity: 'medium' as const,
    recommendation: 'Update to a known TLS version',
  };
}
