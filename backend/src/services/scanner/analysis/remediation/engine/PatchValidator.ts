import { SecurePatch } from '../models/SecurePatch';
import { ValidationAnalyzer } from './ValidationAnalyzer';

export class PatchValidator {
  public static isPatchValid(patch: SecurePatch): boolean {
    return ValidationAnalyzer.validate(patch.replacementCode);
  }
}
