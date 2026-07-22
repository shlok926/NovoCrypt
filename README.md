# NovoCrypt

> **Enterprise-Grade Cryptographic Scanning & Post-Quantum (PQC) Migration Framework.**
> Detect quantum-vulnerable cryptography, audit legacy TLS/JWT infrastructure, and future-proof digital architectures before Q-Day.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-green.svg)
![Pass Rate](https://img.shields.io/badge/tests-130%2F130%20passing-green.svg)

---

## 1. Project Overview

NovoCrypt is an open-source cryptographic audit and post-quantum (PQC) migration scanner core designed for high-throughput enterprise CI/CD environments. It scans source code repositories, configurations, and active server connections to discover legacy algorithms (RSA, ECC, Diffie-Hellman), analyze JWT/symmetric cipher hygiene (AES, key derivation metrics), and generate a detailed Post-Quantum Cryptographic SBOM (Software Bill of Materials) tracking CRYSTALS-Kyber (ML-KEM) and CRYSTALS-Dilithium (ML-DSA) readiness.

NovoCrypt is engineered as a zero-AST, lightweight, linear-time static analysis engine featuring strict memory controls, CPU limits, and early-abort optimizations to defend against scanner denial of service (DoS) and report flooding.

---

## 2. Key Features

- **PQC Audit & SBOM Inventory**: Identifies post-quantum readiness status and logs specific cloud KMS migration guides.
- **Legacy Crypto Inspection**: Uncovers insecure RSA key sizes, outdated elliptic curves, and weak hash functions.
- **Symmetric Cipher Auditing**: Evaluates ECB mode risk, static IVs, and low-iteration PBKDF2/scrypt/argon2 key derivation.
- **JWT Signature Safeguards**: Detects `alg=none` configurations, signature verification bypasses, and insecure key storage.
- **Operational Performance Protections**: Enforces $100\text{ KB}$ file limits, $8,192$-character line caps, and **Early Line Loop Abort** once finding caps are reached.
- **Enterprise Path Suppression**: Enterprise path classification suppresses findings in non-production paths (`docs/`, `build/`, `test/`) to maintain clean security dashboards.

---

## 3. Architecture Overview

```
Source Code / File Input
          │
          ▼
   ScannerEngine
          │
          ▼
DetectionContextBuilder ───► PathFilter (Production vs Test/Doc/Build classification)
          │             ───► LanguageDetector (Node/Python/Go/Config/PEM)
          │             ───► StringResolver (Static template/concatenation resolution)
          ▼
   DetectionContext (Immutable Context Payload)
          │
          ▼
   BaseDetector (Lifecycle management, telemetry hooks, maxFindings limit guard)
          ├── executeDetection()
          │         ├── Sub-Analyzers (Domain-specific static patterns)
          │         └── Early Abort Check (Cuts line loops once threshold is reached)
          ▼
     ScanFinding[]
```

---

## 4. Supported Detectors

| Detector | Category | Scope / Checks | Rule IDs |
| :--- | :--- | :--- | :--- |
| **PQC Detector** | Quantum Migration | Quantum-vulnerable classical primitives, hybrid algorithms, ML-KEM/ML-DSA usage, cloud KMS integration profiles, SBOM inventory compilation. | `PQC001`–`PQC016` |
| **TLS/X.509 Detector** | TLS / PKI Infrastructure | Static certificate expiration, insecure RSA keys, weak SHA-1 signatures, certificate chain loop detection, live connection handshakes. | `TLS001`–`TLS013` |
| **JWT Detector** | Token Authorization | Signature bypass (`jwt.decode`), weak secrets ($< 256$-bit), LocalStorage storage, insecure cookies, unsafe JWKS HTTP endpoints. | `JWT001`–`JWT017` |
| **AES Detector** | Symmetric Encryption | ECB block mode usage, static IV/salt configurations, low iteration key derivation metrics (Argon2, scrypt, PBKDF2). | `AES001`–`AES024` |
| **ECC Detector** | Elliptic Curves | Outdated curve parameters (secp160r1), static nonces, predictable RNG seeding, NIST transition recommendations. | `ECC001`–`ECC005`, `ECCM001` |

---

## 5. Installation

NovoCrypt Scanner Core is written in TypeScript and runs on Node.js (v18+ or v20+).

```bash
# Clone the repository
git clone https://github.com/shlok926/novocrypt.git
cd novocrypt/backend

# Install dependencies
npm install

# Run type check
npx tsc --noEmit

# Execute regression tests
npm test
```

---

## 6. Quick Start & Example Scan

Inject the scanner into your Node.js application to programmatically analyze code target buffers:

```typescript
import { ScannerEngine } from './src/services/scanner/ScannerEngine';
import { ScanContext } from './src/services/scanner/types';

async function runAudit() {
  const engine = new ScannerEngine();

  // Audit configuration
  const context = new ScanContext({
    targetType: 'code',
    target: `
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ user: 'admin' }, 'weak_secret'); // Weak key size risk
      const key = crypto.createDecipheriv('aes-128-ecb', keyBytes, null); // ECB mode risk
    `,
    fileName: 'src/auth.ts',
    language: 'typescript',
    executionOptions: {
      maxFindingsPerFile: 5,
      maxFileSize: 100 * 1024
    }
  });

  const findings = await engine.runScan(context);
  console.log(JSON.stringify(findings, null, 2));
}

runAudit().catch(console.error);
```

---

## 7. Configuration Reference

Configurations are passed via `ExecutionOptions` and `ScanConfiguration` interfaces:

```typescript
export interface ExecutionOptions {
  timeoutMs?: number;         // Execution timeout limit (Default: 250ms per file)
  maxFileSize?: number;       // Max file size bytes allowed (Default: 100 KB)
  enableTelemetry?: boolean;  // Toggle APM metric reporting (Default: true)
  maxFindingsPerFile?: number;// Central finding truncation cap (Default: 50)
}

export interface ScanConfiguration {
  pathFiltering?: {
    mode: 'enterprise' | 'strict' | 'disabled';
    // 'enterprise': suppress non-production target alerts, drop test confidence by 20%
    // 'strict': scan and report on all files without path suppressions
    // 'disabled': bypass path classification logic entirely
  };
}
```

---

## 8. Output Example

When a threat is detected, NovoCrypt returns a structured JSON finding format:

```json
[
  {
    "ruleId": "AES001",
    "severity": "CRITICAL",
    "description": "AES configured with insecure ECB (Electronic Codebook) mode. ECB leaks patterns in ciphertext.",
    "file": "src/crypto.ts",
    "line": 4,
    "snippet": "const cipher = crypto.createCipheriv('aes-128-ecb', key, null);",
    "confidence": 98,
    "confidenceExplanation": {
      "score": 98,
      "reason": "Explicit matching 'aes-128-ecb' identifier found in active instantiation code."
    },
    "evidence": {
      "algorithm": "AES-128-ECB",
      "mode": "ECB",
      "language": "typescript",
      "snippet": "const cipher = crypto.createCipheriv('aes-128-ecb', key, null);"
    },
    "currentRisk": "High. ECB mode encrypts identical plaintext blocks into identical ciphertext blocks, leaking confidential structure.",
    "quantumRisk": "Low. Symmetric algorithm vulnerability; key length should be doubled for Grover's algorithm resistance.",
    "recommendation": "Transition to GCM (Galois/Counter Mode) or another authenticated encryption mode (AEAD).",
    "references": [
      "NIST SP 800-38A",
      "OWASP Top 10 A02:2021-Cryptographic Failures"
    ],
    "fingerprint": "8a3cf1e956bc56209e7de7bf552f190289ab20e0ffbca1a134a65ef9aef342df",
    "timestamp": "2026-07-22T10:10:32.415Z"
  }
]
```

---

## 9. Performance Highlights

- **Linear Matching Complexity**: Sub-analyzers utilize linear matching $O(N)$ regexes with nested quantifier restrictions to prevent catastrophic backtracking.
- **Early Line Loop Abort**: Saves up to 95.8% of CPU iterations by instantly stopping the line loop once the `maxFindingsPerFile` threshold is reached.
- **Microsecond Benchmarks**: Standard source files are scanned and classified in under **0.3ms** per file.

---

## 10. Security Philosophy

NovoCrypt is built for offensive-resilience:
- **No Dynamic Execution**: Never uses `eval()`, `new Function()`, or dynamic imports.
- **Fault Isolation**: Top-level exception wrapping in `BaseDetector` guarantees that local parsing anomalies or invalid ASN.1 DER streams fail gracefully without crashing pipelines.
- **Safe Network Budgets**: Active socket calls terminate strictly within 3,000ms and verify circular dependency graphs to stop certificate issuer loop bombs.

---

## 11. Roadmap

- [x] Standardize Core API, Context, and registry frameworks.
- [x] Integrate Path Filtering and String Resolution pipelines.
- [x] Implement Early Loop Abort optimization.
- [ ] Add static analysis support for RSA keys, SSH config, and package lock supply chain files (Target: Q3 2026).
- [ ] Incorporate AST-based data-flow tracking for source code files (Target: Q4 2026).

---

## 12. Contributing

We welcome contributions! Please review our [Contributing Guide](file:///d:/Desktop/PQC/CONTRIBUTING.md) and [Code of Conduct](file:///d:/Desktop/PQC/CODE_OF_CONDUCT.md) before submitting pull requests.

---

## 13. License

NovoCrypt is open-source software licensed under the **MIT License**. See [LICENSE](file:///d:/Desktop/PQC/LICENSE) for details.
