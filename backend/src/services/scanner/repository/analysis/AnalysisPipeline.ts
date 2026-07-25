import * as fs from 'fs';
import { performance } from 'perf_hooks';
import * as ts from 'typescript';


import { Workspace } from '../workspace/Workspace';
import { WorkspaceGraph, WorkspaceGraphNode } from '../workspace/WorkspaceGraph';
import { WorkspaceIndex } from '../workspace/WorkspaceIndex';
import { DependencyGraph } from '../workspace/DependencyGraph';
import { CrossFileResolver } from './CrossFileResolver';
import { RepositoryCallGraph } from './RepositoryCallGraph';
import { RepositoryTaintAnalyzer } from './RepositoryTaintAnalyzer';
import { ParallelScheduler } from './ParallelScheduler';
import { FileFingerprint } from '../cache/FileFingerprint';
import { AnalysisCache } from '../cache/AnalysisCache';
import { RepositoryConfiguration } from '../RepositoryConfiguration';

// Import compiler frontend services
import { ParserManager } from '../../ast/ParserManager';
import { ASTProvider } from '../../ast/ASTProvider';
import { TraversalEngine } from '../../ast/TraversalEngine';
import { ScopeManager } from '../../ast/ScopeManager';
import { ScopeVisitor } from '../../ast/ScopeVisitor';
import { SymbolTable } from '../../ast/SymbolTable';
import { SymbolVisitor } from '../../ast/SymbolVisitor';
import { CallGraphEngine } from '../../ast/callgraph';
import { DataFlowEngine } from '../../ast/dataflow/DataFlowEngine';
import { FrameworkDiscoveryEngine, FrameworkSemanticEngine, FrameworkSecurityEngine } from '../../ast/framework';
import { PolicyEngine } from '../../policy/engine/PolicyEngine';
import { ScanContext } from '../../types';
import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';


export class AnalysisPipeline {
  private parserManager = new ParserManager();
  private provider = new ASTProvider(this.parserManager);
  private policyEngine = new PolicyEngine();
  private cache = new AnalysisCache();

  public getCache(): AnalysisCache {
    return this.cache;
  }

  public getPolicyEngine(): PolicyEngine {
    return this.policyEngine;
  }

  public async executePipeline(
    workspace: Workspace,
    config: RepositoryConfiguration
  ): Promise<{ findings: FrameworkFinding[]; metrics: any; graph: WorkspaceGraph; index: WorkspaceIndex; dependencyGraph: DependencyGraph }> {
    const startAll = performance.now();

    const graph = new WorkspaceGraph();
    const index = new WorkspaceIndex();
    const dependencyGraph = new DependencyGraph();
    const resolver = new CrossFileResolver();
    const repoCallGraph = new RepositoryCallGraph();
    const repoTaintAnalyzer = new RepositoryTaintAnalyzer();

    const localCallGraphs = new Map<string, any>();
    const localFlowGraphs = new Map<string, any>();
    const symbolTables = new Map<string, SymbolTable>();

    let cacheHits = 0;
    let cacheMisses = 0;

    let timeParsing = 0;
    let timeSemantic = 0;

    // Process files (with parallel scheduler if enabled)
    const workerFn = async (file: string): Promise<any> => {
      const normalizedFile = file.replace(/\\/g, '/');
      let content: string;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch (e) {
        return null;
      }

      const relative = pathRelative(workspace.root, file);
      const fp = FileFingerprint.compute(relative, content);

      // Check cache if enabled
      if (config.cacheEnabled) {
        const cached = this.cache.get(normalizedFile);
        if (cached && cached.fingerprint === fp) {
          cacheHits++;
          return {
            file: normalizedFile,
            cached: true,
            analysis: {
              ...cached,
              scopeManager: cached.scopes,
              symbolTable: cached.symbols
            }
          };
        }
      }

      cacheMisses++;

      const startParse = performance.now();
      const context = new ScanContext({
        targetType: 'code',
        target: content,
        fileName: file,
        language: 'typescript'
      });

      const ast = this.provider.getAST(context);
      if (!ast) return null;
      timeParsing += performance.now() - startParse;

      const startSem = performance.now();
      const scopeManager = new ScopeManager();
      const symbolTable = new SymbolTable();

      const scopeVisitor = new ScopeVisitor(scopeManager);
      const symbolVisitor = new SymbolVisitor(scopeManager, symbolTable);

      const traversal = new TraversalEngine();
      traversal.registerVisitor(scopeVisitor);
      traversal.registerVisitor(symbolVisitor);
      traversal.traverse(ast);

      const callGraphEngine = new CallGraphEngine();
      const callGraph = callGraphEngine.buildCallGraph(ast, scopeManager, symbolTable);

      const dataFlowEngine = new DataFlowEngine();
      const dataFlow = dataFlowEngine.buildFlowGraph(ast, scopeManager, symbolTable);

      const discoveryEngine = new FrameworkDiscoveryEngine();
      const metadata = discoveryEngine.discoverFramework(ast, scopeManager, symbolTable, callGraph);

      const semanticEngine = new FrameworkSemanticEngine();
      const semanticModel = semanticEngine.buildSemanticModel(metadata);

      const securityEngine = new FrameworkSecurityEngine();
      const { findings } = securityEngine.evaluateSecurity(semanticModel, callGraph, dataFlow, metadata);
      timeSemantic += performance.now() - startSem;

      // Extract imports/exports for DependencyGraph and CrossFileResolver
      const imports: string[] = [];
      const exports: string[] = [];
      
      const sourceFile = ast.parserMetadata.get('tsSourceFile');
      if (sourceFile && sourceFile.statements) {
        sourceFile.statements.forEach((stmt: any) => {
          if (ts.isImportDeclaration(stmt)) {
            const specifier = (stmt.moduleSpecifier as ts.StringLiteral).text;
            if (specifier) imports.push(specifier);
          }
        });
      }

      const fileAnalysis = {
        fingerprint: fp,
        ast,
        scopeManager,
        symbolTable,
        callGraph,
        dataFlow,
        metadata,
        semanticModel,
        findings,
        imports,
        exports
      };

      if (config.cacheEnabled) {
        this.cache.set(normalizedFile, {
          fingerprint: fp,
          ast,
          scopes: scopeManager,
          symbols: symbolTable,
          callGraph,
          dataFlow,
          metadata,
          imports,
          exports,
          frameworks: [metadata.framework],
          findings
        });
      }

      return { file: normalizedFile, cached: false, analysis: fileAnalysis };
    };

    const workerCount = config.workerCount ?? 4;
    const taskResults = await ParallelScheduler.executeParallel(workspace.discoveredFiles, workerFn, workerCount);

    const activeFindings: FrameworkFinding[] = [];

    // Assemble unified workspace index & graphs
    for (const res of taskResults) {
      if (!res) continue;
      const file = res.file;
      const ana = res.analysis;

      // Register file node in WorkspaceGraph
      const fileNode: WorkspaceGraphNode = {
        id: file,
        type: 'file',
        label: file,
        file: file,
        metadata: new Map()
      };
      graph.addNode(fileNode);
      index.indexNode(fileNode);

      symbolTables.set(file, ana.symbolTable);
      localCallGraphs.set(file, ana.callGraph);
      localFlowGraphs.set(file, ana.dataFlow);

      // Accumulate findings
      activeFindings.push(...ana.findings);

      // Build dependency relationships
      const rawImports = ana.imports || [];
      for (const impSpec of rawImports) {
        // Resolve absolute path from specifier
        const resolvedTarget = resolveRelativePath(file, impSpec);
        dependencyGraph.addDependency(file, resolvedTarget, impSpec);
        
        // Add dependency edge to graph
        graph.addEdge({
          source: file,
          target: resolvedTarget,
          type: 'dependency'
        });

        // Resolve symbol maps
        resolver.resolveSymbol(file, 'default', impSpec, symbolTables);
      }
    }

    // Build repository-wide Call Graph & Taint Paths
    repoCallGraph.buildCallGraph(localCallGraphs, resolver);
    repoTaintAnalyzer.resolveTaintPaths(localFlowGraphs, resolver);

    // Apply Governance policy evaluations if set
    let governedFindings = activeFindings;
    const policyId = 'default-policy'; // Defaults to default policies
    const activePolicies = this.policyEngine.getPolicyRegistry().getAllPolicies();
    if (activePolicies.length > 0) {
      const activePolicyId = activePolicies[0].id;
      const result = this.policyEngine.evaluatePolicy(activeFindings, activePolicyId);
      governedFindings = [...result.findings];
    }

    const elapsedTotal = performance.now() - startAll;

    const metrics = {
      filesScanned: workspace.discoveredFiles.length,
      cacheHits,
      cacheMisses,
      scanDuration: elapsedTotal,
      timeParsing,
      timeSemantic
    };

    return {
      findings: governedFindings,
      metrics,
      graph,
      index,
      dependencyGraph
    };
  }
}

function pathRelative(from: string, to: string): string {
  const path = require('path');
  return path.relative(from, to).replace(/\\/g, '/');
}

function resolveRelativePath(fromFile: string, specifier: string): string {
  const path = require('path');
  const dir = path.dirname(fromFile);
  let resolved = path.resolve(dir, specifier);
  if (!path.extname(resolved)) {
    const fs = require('fs');
    if (fs.existsSync(resolved + '.ts')) resolved += '.ts';
    else if (fs.existsSync(resolved + '.tsx')) resolved += '.tsx';
    else if (fs.existsSync(resolved + '.js')) resolved += '.js';
    else if (fs.existsSync(resolved + '.jsx')) resolved += '.jsx';
  }
  return resolved.replace(/\\/g, '/');
}
