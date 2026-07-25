import { FunctionSummary } from '../models/FunctionSummary';

export class SummaryValidator {
  public static validate(summary: FunctionSummary): void {
    if (!summary.id) {
      throw new Error('Summary must specify a unique function id');
    }
    if (summary.calls.includes(summary.id)) {
      throw new Error(`Self-recursive call loop detected in summary for '${summary.id}'`);
    }
  }
}
