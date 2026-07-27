import { KnowledgeReference } from '../models/KnowledgeReference';
import { SecurityKnowledgeRegistry } from '../registry/SecurityKnowledgeRegistry';

export class KnowledgeResolver {
  private registry = new SecurityKnowledgeRegistry();

  public resolve(vulnerabilityId: string): KnowledgeReference | undefined {
    return this.registry.getReference(vulnerabilityId);
  }
}
