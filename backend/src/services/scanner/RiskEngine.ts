import { ScanFinding, ScanMetrics, ScanResultData } from './types';

export class RiskEngine {
  public calculateRisk(findings: ScanFinding[]): Pick<ScanResultData, 'metrics' | 'overallRiskScore' | 'quantumReadinessScore' | 'riskLevel' | 'criticalFindings' | 'topRecommendations' | 'algorithmsFound'> {
    const metrics: ScanMetrics = {
      totalFindings: findings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    let securityPenalty = 0;
    let quantumPenalty = 0;
    const algorithms = new Set<string>();
    const recommendations = new Set<string>();

    for (const finding of findings) {
      // 1. Tally metrics
      metrics[finding.severity]++;

      // 2. Track algorithms
      if (finding.algorithm) {
        algorithms.add(finding.algorithm);
      }

      // 3. Track recommendations
      if (finding.recommendation) {
        recommendations.add(finding.recommendation);
      }

      // 4. Calculate Penalties
      switch (finding.severity) {
        case 'critical':
          securityPenalty += 25;
          break;
        case 'high':
          securityPenalty += 15;
          break;
        case 'medium':
          securityPenalty += 5;
          break;
        case 'low':
          securityPenalty += 1;
          break;
      }

      // Assess Quantum Risk (Shor's algorithm impact)
      if (
        finding.quantumRisk && 
        (finding.quantumRisk.toLowerCase().includes('critical') || finding.quantumRisk.toLowerCase().includes('high') || finding.quantumRisk.toLowerCase().includes('broken'))
      ) {
        if (finding.severity === 'critical') quantumPenalty += 30;
        else if (finding.severity === 'high') quantumPenalty += 20;
        else quantumPenalty += 10;
      }
    }

    const overallRiskScore = Math.max(0, Math.min(100, 100 - securityPenalty));
    const quantumReadinessScore = Math.max(0, Math.min(100, 100 - quantumPenalty));

    let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (overallRiskScore < 40) riskLevel = 'critical';
    else if (overallRiskScore < 60) riskLevel = 'high';
    else if (overallRiskScore < 80) riskLevel = 'medium';

    const criticalFindings = findings.filter(f => f.severity === 'critical');
    
    // Sort recommendations to get the most important ones (just returning an array of unique recommendations for now)
    const topRecommendations = Array.from(recommendations).slice(0, 5);

    return {
      metrics,
      overallRiskScore,
      quantumReadinessScore,
      riskLevel,
      criticalFindings,
      topRecommendations,
      algorithmsFound: Array.from(algorithms),
    };
  }
}
