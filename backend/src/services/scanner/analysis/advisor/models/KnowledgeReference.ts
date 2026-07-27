export type ReferenceType = 'CWE' | 'OWASP' | 'CAPEC' | 'ASVS' | 'CERT';

export interface KnowledgeReference {
  readonly id: string;
  readonly type: ReferenceType;
  readonly description: string;
}
