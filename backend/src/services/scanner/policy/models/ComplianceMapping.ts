export interface ComplianceMapping {
  readonly ruleId: string;
  readonly framework: 'OWASP' | 'CWE' | 'CIS' | 'NIST';
  readonly mappedId: string;
}
