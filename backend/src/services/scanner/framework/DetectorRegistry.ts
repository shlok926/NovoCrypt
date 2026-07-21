import { CryptoDetector, TargetType } from '../types';

export class DetectorRegistry {
  private detectors: Map<string, CryptoDetector> = new Map();

  /**
   * Register a new detector plugin.
   */
  public register(detector: CryptoDetector): void {
    if (this.detectors.has(detector.id)) {
      throw new Error(`DetectorRegistry: Detector with ID '${detector.id}' is already registered.`);
    }
    this.detectors.set(detector.id, detector);
    if (typeof detector.onRegister === 'function') {
      try {
        detector.onRegister();
      } catch (err) {
        console.error(`[DetectorRegistry] Failed to invoke onRegister for ${detector.id}:`, err);
      }
    }
  }

  /**
   * Get all detectors applicable for a specific target type.
   */
  public getActiveDetectors(targetType: TargetType): CryptoDetector[] {
    return Array.from(this.detectors.values()).filter(d => 
      d.supportedTargets.includes(targetType)
    );
  }

  /**
   * Retrieve a detector by its unique ID.
   */
  public getDetector(id: string): CryptoDetector | undefined {
    return this.detectors.get(id);
  }

  /**
   * Return all registered detectors (useful for audits and metrics).
   */
  public getAllDetectors(): CryptoDetector[] {
    return Array.from(this.detectors.values());
  }

  /**
   * Unregister a detector (useful for dynamic plugin unloading).
   */
  public unregister(id: string): boolean {
    const detector = this.detectors.get(id);
    if (!detector) return false;
    
    const deleted = this.detectors.delete(id);
    if (deleted) {
      if (typeof detector.onUnregister === 'function') {
        try {
          detector.onUnregister();
        } catch (err) {
          console.error(`[DetectorRegistry] Failed to invoke onUnregister for ${id}:`, err);
        }
      }
    }
    return deleted;
  }
}

// Global registry instance
export const detectorRegistry = new DetectorRegistry();
