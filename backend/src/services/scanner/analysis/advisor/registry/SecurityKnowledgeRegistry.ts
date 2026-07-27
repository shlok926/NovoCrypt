import { KnowledgeReference } from '../models/KnowledgeReference';

export class SecurityKnowledgeRegistry {
  private references = new Map<string, KnowledgeReference>([
    [
      'sql_injection',
      {
        id: 'CWE-89',
        type: 'CWE',
        description: 'Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)'
      }
    ],
    [
      'xss',
      {
        id: 'CWE-79',
        type: 'CWE',
        description: 'Improper Neutralization of Input During Web Page Generation (Cross-site Scripting)'
      }
    ]
  ]);

  public getReference(vulnerabilityId: string): KnowledgeReference | undefined {
    return this.references.get(vulnerabilityId);
  }

  public registerReference(vulnerabilityId: string, ref: KnowledgeReference): void {
    this.references.set(vulnerabilityId, ref);
  }
}
