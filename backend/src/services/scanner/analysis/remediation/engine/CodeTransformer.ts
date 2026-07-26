export class CodeTransformer {
  public static transform(original: string, before: string, after: string): string {
    return original.replace(before, after);
  }
}
