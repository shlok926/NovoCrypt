export interface ProtocolMatch {
  protocol: string;
  api: string;
  description: string;
  matchedString: string;
}

export class ProtocolAnalyzer {
  public analyzeLine(line: string, astNodes?: any): ProtocolMatch | null {
    // 1. TLS protocols
    const tlsMatch = /\b(TLSv1_2|TLSv1_3|TLSv1\.2|TLSv1\.3)\b/i.exec(line);
    if (tlsMatch) {
      return {
        protocol: 'TLS',
        api: tlsMatch[0],
        description: `TLS protocol parameter configured: "${tlsMatch[0]}".`,
        matchedString: tlsMatch[0]
      };
    }

    // 2. SSH protocols
    const sshMatch = /\b(ssh-rsa|ssh-dss|ssh-ed25519)\b/i.exec(line);
    if (sshMatch) {
      return {
        protocol: 'SSH',
        api: sshMatch[0],
        description: `SSH key exchange or protocol parameter configured: "${sshMatch[0]}".`,
        matchedString: sshMatch[0]
      };
    }

    // 3. VPN / IPsec / WireGuard
    const vpnMatch = /\b(ipsec|wireguard|vpn|ikev2|openvpn)\b/i.exec(line);
    if (vpnMatch) {
      return {
        protocol: 'VPN',
        api: vpnMatch[0],
        description: `VPN / IPSec / WireGuard communication protocol detected: "${vpnMatch[0]}".`,
        matchedString: vpnMatch[0]
      };
    }

    // 4. Cryptographic message syntax (CMS) / S/MIME
    const cmsMatch = /(?:\b|_)(cms|smime|s\/mime)(?:\b|_)/i.exec(line);
    if (cmsMatch) {
      return {
        protocol: 'CMS/S-MIME',
        api: cmsMatch[1],
        description: `Cryptographic Message Syntax (CMS) / S/MIME message formatting detected: "${cmsMatch[1]}".`,
        matchedString: cmsMatch[0]
      };
    }

    // 5. PKCS#11 Hardware Security Modules APIs
    const pkcs11Match = /\b(pkcs11|pkcs#11|gpkcs11)\b/i.exec(line);
    if (pkcs11Match) {
      return {
        protocol: 'PKCS#11',
        api: pkcs11Match[0],
        description: `Hardware Security Module PKCS#11 interface detected: "${pkcs11Match[0]}".`,
        matchedString: pkcs11Match[0]
      };
    }

    return null;
  }
}
