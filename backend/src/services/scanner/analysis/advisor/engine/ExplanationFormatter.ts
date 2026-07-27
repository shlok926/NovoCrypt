import { SecurityExplanation } from '../models/SecurityExplanation';

export class ExplanationFormatter {
  public static format(exp: SecurityExplanation): string {
    return `### ${exp.issueSummary}\n${exp.technicalDescription}`;
  }
}
