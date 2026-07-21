import { scannerEngine } from './ScannerEngine';
import { RsaDetector } from './detectors/RsaDetector';
import { DeprecatedHashDetector } from './detectors/DeprecatedHashDetector';
import { TlsX509Detector } from './detectors/tls-x509-detector';
import { EccDetector } from './detectors/ecc-detector';
import { JwtDetector } from './detectors/jwt-detector';
import { AesDetector } from './detectors/aes-detector';
import { PqcDetector } from './detectors/pqc-detector';

// Register core detectors
scannerEngine.registerDetector(new RsaDetector());
scannerEngine.registerDetector(new DeprecatedHashDetector());
scannerEngine.registerDetector(new TlsX509Detector());
scannerEngine.registerDetector(new EccDetector());
scannerEngine.registerDetector(new JwtDetector());
scannerEngine.registerDetector(new AesDetector());
scannerEngine.registerDetector(new PqcDetector());

export { scannerEngine };
export * from './types';
export * from './RiskEngine';



