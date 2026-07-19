import { reportEngine } from './ReportEngine';
import { ThreatIntelligenceSection } from './sections/ThreatIntelligenceSection';
import { ScannerResultsSection } from './sections/ScannerResultsSection';
import { PqcReadinessSection } from './sections/PqcReadinessSection';

// Register all core report sections
reportEngine.registerSection(new ThreatIntelligenceSection());
reportEngine.registerSection(new ScannerResultsSection());
reportEngine.registerSection(new PqcReadinessSection());

export { reportEngine };
export * from './ReportSection';
