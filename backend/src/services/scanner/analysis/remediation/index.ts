export * from './models/RemediationPlan';
export * from './models/RemediationAction';
export * from './models/PatchStrategy';
export * from './models/SecurePatch';
export * from './models/PatchCandidate';
export * from './models/PatchConflict';
export * from './models/PatchDiff';
export * from './models/PatchLocation';
export * from './models/FixSuggestion';
export * from './models/SecureAlternative';
export * from './models/BehaviourImpact';
export * from './models/RegressionRisk';
export * from './models/PatchEvidence';
export * from './models/PatchConfidence';
export * from './models/RemediationSummary';

export * from './engine/RemediationEngine';
export * from './engine/PatchGenerator';
export * from './engine/CodeTransformer';
export * from './engine/SecureApiRecommender';
export * from './engine/FrameworkFixGenerator';
export * from './engine/ValidationAnalyzer';
export * from './engine/PatchValidator';
export * from './engine/BehaviourAnalyzer';
export * from './engine/RegressionAnalyzer';
export * from './engine/FixDependencyAnalyzer';
export * from './engine/PatchRanker';
export * from './engine/PatchExplainer';

export * from './registry/FixPatternRegistry';
export * from './registry/FrameworkPatchRegistry';
export * from './registry/SecureApiRegistry';

export * from './cache/PatchCache';
export * from './cache/RemediationCache';
export * from './report/RemediationMetrics';

export * from './RemediationConfiguration';
export * from './RemediationOrchestrator';
