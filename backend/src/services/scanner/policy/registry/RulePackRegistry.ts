import { RulePackMetadata } from '../models/RulePack';

export class RulePackRegistry {
  private packs = new Map<string, RulePackMetadata>();

  public registerPack(pack: RulePackMetadata): void {
    this.packs.set(pack.id, pack);
  }

  public getPack(packId: string): RulePackMetadata | undefined {
    return this.packs.get(packId);
  }

  public getAllPacks(): readonly RulePackMetadata[] {
    return Array.from(this.packs.values());
  }

  public removePack(packId: string): void {
    this.packs.delete(packId);
  }

  public clear(): void {
    this.packs.clear();
  }
}
