import { CurveDetails } from './ecc-types';

export class QuantumMigrationAnalyzer {
  public checkMigrationNeed(curve: CurveDetails): boolean {
    // Only secure modern curves need quantum migration recommendations
    // Weak or deprecated curves will already trigger security vulnerability rules (ECC001/ECC002)
    return curve.classification === 'Secure Classical';
  }
}
