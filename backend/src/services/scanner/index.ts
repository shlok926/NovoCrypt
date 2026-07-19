import { scannerEngine } from './ScannerEngine';
import { RsaDetector } from './detectors/RsaDetector';
import { DeprecatedHashDetector } from './detectors/DeprecatedHashDetector';

// Register core detectors
scannerEngine.registerDetector(new RsaDetector());
scannerEngine.registerDetector(new DeprecatedHashDetector());

export { scannerEngine };
export * from './types';
export * from './RiskEngine';
