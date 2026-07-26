import { SecureAlternative } from '../models/SecureAlternative';
import { SecureApiRegistry } from '../registry/SecureApiRegistry';

export class SecureApiRecommender {
  private registry = new SecureApiRegistry();

  public getAlternative(name: string): SecureAlternative | undefined {
    return this.registry.getAlternative(name);
  }
}
