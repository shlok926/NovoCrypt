# Security Policy

## Supported Versions

NovoCrypt maintains security updates for the following active release paths:

| Version | Supported |
| :--- | :---: |
| v1.0.x | Yes |
| < v1.0.x | No |

## Reporting a Vulnerability

We take the security of NovoCrypt seriously. If you find a security vulnerability, please do **not** report it via a public GitHub issue. Instead, report it privately to our security team.

### How to Contact Us
Please send all security-related vulnerability reports via email to **security@novocrypt.org** (or use the vulnerability disclosure process via our GitHub repository security tab).

### Please include the following information:
1. **Description**: Detail the vulnerability, including its severity and potential security implications.
2. **Steps to Reproduce**: Provide step-by-step instructions or a proof-of-concept (PoC) script to reproduce the issue.
3. **Environment**: Include details of the runtime environment (Node.js version, platform, architecture, dependencies).
4. **Remediation Suggestion**: If you have investigated a fix, please share your recommendation.

## Disclosure Policy

- **Confidentiality**: We will maintain strict confidentiality of your report throughout the investigation and remediation process.
- **Triage**: Our security team will review and triage reports within **48 hours** of submission.
- **Response**: We aim to resolve and issue a patch for validated high/critical severity bugs within **30 days**.
- **Attribution**: Once patched, we will coordinate public disclosure and gladly credit you for the discovery in the release notes, unless you request anonymity.

## Security Scope

Our core security scope covers:
- **Parser Robustness**: Prevention of parser-based Denial of Service (DoS) attacks, infinite loops, and stack overflows on malicious inputs.
- **Regex Safety**: Prevention of regular expression catastrophic backtracking (ReDoS) vulnerability vectors.
- **Report & Telemetry Isolation**: Guaranteeing request-scoped isolation to prevent cross-scan data leakage.
- **Path Traversal Shielding**: Ensuring relative paths do not leak outside of target workspaces.
