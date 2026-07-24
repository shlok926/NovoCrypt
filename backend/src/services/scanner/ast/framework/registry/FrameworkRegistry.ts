import { FrameworkType } from '../models/FrameworkModel';
import { FrameworkPlugin } from './FrameworkPlugin';

export class FrameworkRegistry {
  private plugins = new Map<FrameworkType, FrameworkPlugin>();

  public registerPlugin(plugin: FrameworkPlugin): void {
    this.plugins.set(plugin.framework, plugin);
  }

  public getPlugins(): FrameworkPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getPlugin(framework: FrameworkType): FrameworkPlugin | undefined {
    return this.plugins.get(framework);
  }

  public clear(): void {
    this.plugins.clear();
  }
}
