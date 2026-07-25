export class CallString {
  constructor(public readonly calls: readonly string[] = []) {}

  public push(callSite: string): CallString {
    return new CallString([...this.calls, callSite]);
  }

  public toString(): string {
    return this.calls.join(' -> ');
  }

  public get depth(): number {
    return this.calls.length;
  }
}
