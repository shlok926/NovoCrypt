import { scannerEngine } from './ScannerEngine';
import { RsaDetector } from './detectors/RsaDetector';
import { DeprecatedHashDetector } from './detectors/DeprecatedHashDetector';
import { TlsX509Detector } from './detectors/tls-x509-detector';
import { EccDetector } from './detectors/ecc-detector';

// Register core detectors
scannerEngine.registerDetector(new RsaDetector());
scannerEngine.registerDetector(new DeprecatedHashDetector());
scannerEngine.registerDetector(new TlsX509Detector());
scannerEngine.registerDetector(new EccDetector());

export { scannerEngine };
export * from './types';
export * from './RiskEngine';


