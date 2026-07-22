import { NovoNode } from './NovoNode';
import { IASTVisitor } from './IASTVisitor';
import { TraversalContext } from './TraversalContext';
import { TraversalMetrics } from './TraversalMetrics';
import { ASTContext } from './ASTContext';

export interface TraversalOptions {
  maxDepthLimit?: number;
  maxNodeLimit?: number;
  stopOnError?: boolean; // If true, abort traversal on first visitor error, otherwise isolate error and continue
}

export class TraversalEngine {
  private visitors: IASTVisitor[] = [];
  private options: TraversalOptions;

  constructor(options?: TraversalOptions) {
    this.options = options || {
      maxDepthLimit: 1000,
      maxNodeLimit: 100000,
      stopOnError: false
    };
  }

  public registerVisitor(visitor: IASTVisitor): void {
    if (this.visitors.some(v => v.id === visitor.id)) {
      throw new Error(`TraversalEngine: Visitor with ID '${visitor.id}' is already registered.`);
    }
    this.visitors.push(visitor);
  }

  public unregisterVisitor(id: string): boolean {
    const initialLength = this.visitors.length;
    this.visitors = this.visitors.filter(v => v.id !== id);
    return this.visitors.length < initialLength;
  }

  public clearVisitors(): void {
    this.visitors = [];
  }

  public getVisitors(): IASTVisitor[] {
    return [...this.visitors];
  }

  public traverse(astContext: ASTContext): TraversalMetrics {
    const startTime = performance.now();
    const metrics: TraversalMetrics = {
      nodesVisited: 0,
      nodesSkipped: 0,
      visitorInvocations: 0,
      executionTimeMs: 0,
      maxDepth: 0,
      earlyExit: false,
      errorCount: 0
    };

    let stopRequested = false;
    const requestStop = () => {
      stopRequested = true;
      metrics.earlyExit = true;
    };
    const isStopRequested = () => stopRequested;

    const visitorMetadata = new Map<string, any>();

    const context: TraversalContext = {
      filename: astContext.filename,
      language: astContext.language,
      currentDepth: 0,
      path: [],
      root: astContext.root,
      metrics,
      visitorMetadata,
      requestStop,
      isStopRequested
    };

    // 1. Lifecycle: beforeTraversal
    for (const visitor of this.visitors) {
      if (typeof visitor.beforeTraversal === 'function') {
        try {
          visitor.beforeTraversal(context);
        } catch (err) {
          metrics.errorCount++;
          if (this.options.stopOnError) {
            stopRequested = true;
            metrics.earlyExit = true;
            break;
          }
        }
      }
    }

    if (!stopRequested) {
      // 2. Traversal
      this.walk(astContext.root, context, metrics);
    }

    // 3. Lifecycle: afterTraversal
    for (const visitor of this.visitors) {
      if (typeof visitor.afterTraversal === 'function') {
        try {
          visitor.afterTraversal(context);
        } catch (err) {
          metrics.errorCount++;
          if (this.options.stopOnError) {
            metrics.earlyExit = true;
            break;
          }
        }
      }
    }

    metrics.executionTimeMs = performance.now() - startTime;
    return metrics;
  }

  private walk(node: NovoNode, context: TraversalContext, metrics: TraversalMetrics): void {
    if (context.isStopRequested()) return;

    // Check limits
    if (this.options.maxNodeLimit && metrics.nodesVisited >= this.options.maxNodeLimit) {
      context.requestStop();
      return;
    }
    if (this.options.maxDepthLimit && context.currentDepth >= this.options.maxDepthLimit) {
      context.requestStop();
      return;
    }

    metrics.nodesVisited++;
    metrics.maxDepth = Math.max(metrics.maxDepth, context.currentDepth + 1);

    // Update path stack
    const parent = context.path[context.path.length - 1];
    context.path.push(node);
    
    const nextContext = {
      ...context,
      currentDepth: context.currentDepth + 1,
      parent
    };

    // 1. Enter node
    for (const visitor of this.visitors) {
      if (context.isStopRequested()) break;

      // Node filtering check
      if (visitor.nodeTypes && !visitor.nodeTypes.includes(node.type)) {
        metrics.nodesSkipped++;
        continue;
      }

      if (typeof visitor.enterNode === 'function') {
        try {
          metrics.visitorInvocations++;
          visitor.enterNode(node, nextContext);
        } catch (err) {
          metrics.errorCount++;
          const visitorErr = err instanceof Error ? err : new Error(String(err));
          if (typeof visitor.onError === 'function') {
            try {
              visitor.onError(visitorErr, node, nextContext);
            } catch (err2) {}
          }
          if (this.options.stopOnError) {
            context.requestStop();
            break;
          }
        }
      }
    }

    // 2. Recursive depth-first descent
    if (!context.isStopRequested() && node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (context.isStopRequested()) break;
        this.walk(child, nextContext, metrics);
      }
    }

    // 3. Leave node
    for (const visitor of this.visitors) {
      if (context.isStopRequested()) break;

      // Node filtering check
      if (visitor.nodeTypes && !visitor.nodeTypes.includes(node.type)) {
        continue;
      }

      if (typeof visitor.leaveNode === 'function') {
        try {
          metrics.visitorInvocations++;
          visitor.leaveNode(node, nextContext);
        } catch (err) {
          metrics.errorCount++;
          const visitorErr = err instanceof Error ? err : new Error(String(err));
          if (typeof visitor.onError === 'function') {
            try {
              visitor.onError(visitorErr, node, nextContext);
            } catch (err2) {}
          }
          if (this.options.stopOnError) {
            context.requestStop();
            break;
          }
        }
      }
    }

    context.path.pop();
  }
}
