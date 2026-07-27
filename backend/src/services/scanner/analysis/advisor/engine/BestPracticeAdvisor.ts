import { BestPractice, BestPracticeRegistry } from '../registry/BestPracticeRegistry';

export class BestPracticeAdvisor {
  private registry = new BestPracticeRegistry();

  public getAdvice(id: string): BestPractice | undefined {
    return this.registry.getPractice(id);
  }
}
