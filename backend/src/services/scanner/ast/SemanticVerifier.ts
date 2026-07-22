import { ScanFinding } from '../types';
import { ASTContext } from './ASTContext';
import { ScopeManager } from './ScopeManager';
import { SymbolTable } from './SymbolTable';
import { TypeResolver } from './TypeResolver';
import { NovoNode } from './NovoNode';
import { isBufferLike } from './Type';

export class SemanticVerifier {
  public static verifyAll(findings: ScanFinding[], astContext: ASTContext): ScanFinding[] {
    const scopeManager = astContext.parserMetadata.get('scopeManager') as ScopeManager;
    const symbolTable = astContext.parserMetadata.get('symbolTable') as SymbolTable;
    const typeResolver = astContext.parserMetadata.get('typeResolver') as TypeResolver;

    if (!scopeManager || !symbolTable || !typeResolver) {
      return findings;
    }

    const verifiedFindings: ScanFinding[] = [];

    for (const finding of findings) {
      if (!finding.evidence || !finding.evidence.line) {
        verifiedFindings.push(finding);
        continue;
      }

      const line = finding.evidence.line;
      const snippet = finding.evidence.snippet;
      
      // Attempt to locate target node
      let targetNode = this.findMatchingNode(astContext.root, line, snippet);
      if (!targetNode) {
        targetNode = this.findFallbackNodeOnLine(astContext.root, line);
      }

      if (!targetNode) {
        verifiedFindings.push(finding);
        continue;
      }

      const verified = this.verifyFinding(finding, targetNode, scopeManager, symbolTable, typeResolver);
      if (verified) {
        verifiedFindings.push(verified);
      }
    }

    return verifiedFindings;
  }

  private static verifyFinding(
    finding: ScanFinding,
    node: NovoNode,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable,
    typeResolver: TypeResolver
  ): ScanFinding | null {
    const name = node.metadata.get('name') || finding.evidence.snippet;
    
    // Resolve Symbol
    const symbol = symbolTable.resolveIdentifier(name, scopeManager) || symbolTable.findByDeclaration(node);
    
    let type = typeResolver.resolveType(node);
    let confidence = finding.confidence;
    let confidenceReason = finding.confidenceExplanation?.reason || 'Regex match';
    
    const semanticEvidence: any = {
      verificationResult: 'Unverified'
    };

    if (symbol) {
      confidence = 75; // Regex + Symbol Match
      confidenceReason = 'Regex + Symbol Match';
      type = typeResolver.resolveSymbolType(symbol);

      semanticEvidence.resolvedSymbol = symbol.name;
      semanticEvidence.resolvedScope = `Scope: ${symbol.scope.id} (${symbol.scope.type})`;
      semanticEvidence.resolvedType = type.kind;
      semanticEvidence.declarationLocation = symbol.declaration.location;
      semanticEvidence.referenceCount = symbol.references.length;
      semanticEvidence.importStatus = symbol.imported;
      semanticEvidence.exportStatus = symbol.exported;
      semanticEvidence.verificationResult = 'Confirmed';

      if (type.kind !== 'Unknown') {
        confidence = 90; // Regex + Symbol + Type resolved
        confidenceReason = 'Regex + Symbol + Type resolved';
      }

      // AST Confirmation Checks
      const ruleId = finding.ruleId;
      let confirmed = false;

      if (ruleId.startsWith('AES')) {
        if (isBufferLike(type) || type.kind === 'Literal' || type.kind === 'String') {
          confirmed = true;
        }
      } 
      else if (ruleId.startsWith('JWT')) {
        if (type.kind === 'Literal' || type.kind === 'String' || isBufferLike(type)) {
          confirmed = true;
        }
      } 
      else if (ruleId.startsWith('TLS')) {
        if (type.kind === 'Literal' && typeof type.value === 'string') {
          confirmed = true;
        }
      }
      else if (ruleId.startsWith('ECC') || ruleId.startsWith('PQC')) {
        if (type.kind === 'Literal' || type.kind === 'String') {
          confirmed = true;
        }
      }

      if (confirmed) {
        confidence = 98; // Regex + Symbol + Type + AST Confirmation
        confidenceReason = 'Regex + Symbol + Type + AST Confirmation';
        semanticEvidence.verificationResult = 'Confirmed';
      }
    }

    // Return enriched verified finding
    return {
      ...finding,
      confidence,
      confidenceExplanation: {
        level: confidence >= 90 ? 'Critical' : confidence >= 75 ? 'High' : 'Medium',
        reason: confidenceReason
      },
      metadata: {
        ...finding.metadata,
        semanticEvidence
      }
    };
  }

  private static findMatchingNode(node: NovoNode, line: number, snippet: string): NovoNode | undefined {
    if (node.location.startLine === line || (line >= node.location.startLine && line <= node.location.endLine)) {
      const name = node.metadata.get('name');
      if (node.type === 'Identifier' && name === snippet) {
        return node;
      }
      const val = node.metadata.get('value');
      if (node.type === 'StringLiteral' && val === snippet) {
        return node;
      }
      if (node.type === 'VariableDeclaration' && name === snippet) {
        return node;
      }
    }
    for (const child of node.children) {
      const match = this.findMatchingNode(child, line, snippet);
      if (match) return match;
    }
    return undefined;
  }

  private static findFallbackNodeOnLine(node: NovoNode, line: number): NovoNode | undefined {
    if (node.location.startLine === line) {
      if (node.type === 'Identifier' || node.type === 'CallExpression' || node.type === 'VariableDeclaration') {
        return node;
      }
    }
    for (const child of node.children) {
      const match = this.findFallbackNodeOnLine(child, line);
      if (match) return match;
    }
    return undefined;
  }
}
