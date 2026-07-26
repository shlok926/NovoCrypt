import { FrameworkSemanticModel } from '../models/FrameworkSemanticModel';

export class SemanticModelRegistry {
  private models = new Map<string, FrameworkSemanticModel>();

  public registerModel(name: string, model: FrameworkSemanticModel): void {
    this.models.set(name, model);
  }

  public getModel(name: string): FrameworkSemanticModel | undefined {
    return this.models.get(name);
  }
}
