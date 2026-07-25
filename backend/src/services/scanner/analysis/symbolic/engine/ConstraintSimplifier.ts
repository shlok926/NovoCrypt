import { Constraint } from '../models/Constraint';

export class ConstraintSimplifier {
  public static simplify(constraints: readonly Constraint[]): Constraint[] {
    const simplified: Constraint[] = [];
    const seen = new Set<string>();

    for (const c of constraints) {
      const exprLeftName = (c.expression.left as any).name || 'unknown';
      const key = `${exprLeftName}:${c.expression.operator}:${c.expression.right}:${c.negate}`;

      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      simplified.push(c);
    }

    return simplified;
  }
}
