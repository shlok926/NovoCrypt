# AI-Assisted Security Reasoning & Intelligent Remediation Advisor

This module provides developer-oriented security reasoning, remediation narratives, prioritization guidance, and educational insights. The underlying AST parser, interprocedural analysis, symbolic solver, framework models, and exploitability engines remain the authoritative source of truth. The AI Advisor consumes their outputs to generate explanations and comparative guides.

---

## 1. Complete AI Security Reasoning Pipeline

The flow of reasoning traverses the following pipeline:

```
Repository
   │
   ▼
Repository Analysis
   │
   ▼
Interprocedural Analysis
   │
   ▼
Symbolic Execution
   │
   ▼
Framework Semantic Models
   │
   ▼
Exploitability Analysis
   │
   ▼
Automated Remediation
   │
   ▼
Evidence Linking (EvidenceLinker)
   │
   ▼
Reasoning Trace Construction (ReasoningTrace)
   │
   ▼
Root Cause Analysis (RootCauseAnalyzer)
   │
   ▼
Knowledge Resolution (KnowledgeResolver)
   │
   ▼
Recommendation Generation (RecommendationGenerator)
   │
   ▼
Recommendation Conflict Resolution (RecommendationConflictAnalyzer)
   │
   ▼
Fix Comparison (FixComparator)
   │
   ▼
Developer Guidance (DeveloperGuidanceGenerator)
   │
   ▼
Explanation Formatting (ExplanationFormatter)
   │
   ▼
Advisor Report
   │
   ▼
Policy Engine
   │
   ▼
SARIF / IDE
```

- **Deterministic Analysis (Authoritative):** AST Analysis, Symbolic Execution, Exploitability, Remediation.
- **Reasoning Layer:** Evidence Linker, Root Cause Analyzer, Knowledge Resolver, Recommendation Generator, Fix Comparator.
- **Presentation Layer:** Developer Guidance, Explanation Formatter, SARIF/IDE exporters.

---

## 2. Confidence Model

The AI Advisor inherits the confidence calculation model directly from the deterministic engines. It does not calculate or modify confidence itself. The confidence score (0–100) and label (Low, Medium, High) are determined by:
- **Symbolic Certainty:** SMT sat/unsat validation precision.
- **Exploitability Confidence:** Taint reachability evidence quality.
- **Remediation Confidence:** Compilation/syntax verification checks.
- **Framework Compatibility:** Adaptor specificity (Express, React, NestJS, etc.).
- **Evidence Coverage:** Number of traversed AST nodes matched.
- **Repository Completeness:** Missing call graph edges or external references.
- **Behaviour Preservation:** AST equivalency verification checks.
- **Regression Analysis:** Call graph dependency impact.
- **Patch Validation:** Syntax validation of the patch.
- **Explanation Completeness:** Renders presentation quality flags only.

---

## 3. Knowledge Registry Mappings

The registry maps vulnerability IDs to standard identifiers and advisory guidance:
- **CWE:** CWE-89 (SQL Injection), CWE-79 (XSS), etc.
- **OWASP:** OWASP Top 10 Categories.
- **OWASP ASVS:** Verification requirements.
- **CERT Secure Coding:** Coding guidelines.
- **CAPEC:** Attack patterns.
- **Framework Hardening:** Helmet configuration for Express, Guards/Pipes rules for NestJS, DOMPurify configuration for React.
- **MITRE ATT&CK:** Post-exploitation context defensive mappings.

---

## 4. Memory Scaling & Caching

Memory consumption scales predictably according to the workspace size:
- **Cache Reuse:** Incremental rescans reuse cached explanations and recommendations.
- **Cache Invalidation:** Only modified or affected files invalidate cache entries.
- **Cache Targets:** Cache stores compiled `SecurityExplanation` and `Recommendation` objects to prevent redundant reasoning.

---

## 5. Enterprise Benchmarks

The Advisor engine is optimized to satisfy the following target metrics:
- **Scale:** Explaining **100,000 findings** and **50,000 attack scenarios**.
- **Monorepos:** Support parallel explanation generation across multi-framework monorepos.
- **Conflict Resolution:** Fast repository-wide recommendation conflict resolution.
