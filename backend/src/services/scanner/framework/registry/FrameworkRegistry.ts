export interface FrameworkAdapter {
  readonly name: string;
  detect(codeLines: string[]): boolean;
  getEndpoints(codeLines: string[]): any[];
  getMiddlewares(codeLines: string[]): any[];
}

export class FrameworkRegistry {
  private adapters = new Map<string, FrameworkAdapter>();

  public registerAdapter(name: string, adapter: FrameworkAdapter): void {
    this.adapters.set(name, adapter);
  }

  public getAdapter(name: string): FrameworkAdapter | undefined {
    return this.adapters.get(name);
  }

  public discoverFrameworks(codeLines: string[]): string[] {
    const detected: string[] = [];
    this.adapters.forEach((adapter, name) => {
      if (adapter.detect(codeLines)) {
        detected.push(name);
      }
    });
    return detected;
  }
}
