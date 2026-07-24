import { ASTContext } from '../../ASTContext';
import { ScopeManager } from '../../ScopeManager';
import { SymbolTable } from '../../SymbolTable';
import { CallGraph } from '../../callgraph/CallGraph';
import { FrameworkType } from '../models/FrameworkModel';
import { DiscoveryResult } from '../discovery/DiscoveryResult';
import { FrameworkRegistry } from './FrameworkRegistry';

export interface FrameworkPluginCapabilities {
  readonly routes: boolean;
  readonly middleware: boolean;
  readonly nestedRouters: boolean;
  readonly errorHandlers: boolean;
  readonly decorators: boolean;
}

export interface FrameworkPlugin {
  readonly framework: FrameworkType;
  readonly capabilities: FrameworkPluginCapabilities;
  detect(astContext: ASTContext): boolean;
  discover(
    astContext: ASTContext,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable,
    callGraph: CallGraph,
    registry: FrameworkRegistry
  ): DiscoveryResult;
}
