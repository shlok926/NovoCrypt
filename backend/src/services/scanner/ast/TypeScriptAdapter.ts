import * as ts from 'typescript';
import { LanguageAdapter } from './LanguageAdapter';
import { ASTContext, ASTDiagnostic } from './ASTContext';
import { NovoNode, NodeLocation } from './NovoNode';

export class TypeScriptAdapter implements LanguageAdapter {
  public supportedLanguages = ['typescript', 'javascript'];

  public parse(source: string, filename: string, options?: ts.CompilerOptions): ASTContext {
    const startTime = performance.now();
    const compileOptions = options || {
      target: ts.ScriptTarget.ES2020,
      allowJs: true
    };
    
    const sourceFile = ts.createSourceFile(
      filename,
      source,
      compileOptions.target || ts.ScriptTarget.Latest,
      true // setParentNodes
    );

    const diagnostics: ASTDiagnostic[] = [];
    if ((sourceFile as any).parseDiagnostics && (sourceFile as any).parseDiagnostics.length > 0) {
      for (const diag of (sourceFile as any).parseDiagnostics) {
        const start = diag.start !== undefined ? sourceFile.getLineAndCharacterOfPosition(diag.start) : undefined;
        diagnostics.push({
          message: typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText,
          line: start ? start.line + 1 : undefined,
          column: start ? start.character + 1 : undefined,
          severity: 'error'
        });
      }
    }

    let nodeCount = 0;
    const countNodes = (n: ts.Node) => {
      nodeCount++;
      n.forEachChild(countNodes);
    };
    countNodes(sourceFile);

    const root = this.normalizeNode(sourceFile, filename.endsWith('.ts') ? 'typescript' : 'javascript', source);

    const parseTimeMs = performance.now() - startTime;
    const lineCount = source.split('\n').length;

    const parserMetadata = new Map<string, any>();
    parserMetadata.set('tsSourceFile', sourceFile);

    return {
      root,
      language: filename.endsWith('.ts') ? 'typescript' : 'javascript',
      filename,
      statistics: {
        nodeCount,
        parseTimeMs,
        lineCount
      },
      parserMetadata,
      diagnostics
    };
  }

  public normalizeNode(
    nativeNode: ts.Node,
    language: string,
    source: string,
    parent?: NovoNode
  ): NovoNode {
    const sourceFile = nativeNode.getSourceFile() || (nativeNode.kind === ts.SyntaxKind.SourceFile ? nativeNode as ts.SourceFile : undefined);
    
    let location: NodeLocation = {
      startLine: 0,
      startColumn: 0,
      endLine: 0,
      endColumn: 0,
      pos: nativeNode.pos,
      end: nativeNode.end
    };

    if (sourceFile) {
      try {
        const start = sourceFile.getLineAndCharacterOfPosition(nativeNode.getStart(sourceFile));
        const end = sourceFile.getLineAndCharacterOfPosition(nativeNode.getEnd());
        location = {
          startLine: start.line + 1,
          startColumn: start.character + 1,
          endLine: end.line + 1,
          endColumn: end.character + 1,
          pos: nativeNode.pos,
          end: nativeNode.end
        };
      } catch (e) {
        // Fallback for detached nodes
        location = {
          startLine: 1,
          startColumn: 1,
          endLine: 1,
          endColumn: 1,
          pos: nativeNode.pos,
          end: nativeNode.end
        };
      }
    }

    // Determine normalized type mapping
    let type = ts.SyntaxKind[nativeNode.kind];
    
    if (nativeNode.kind === ts.SyntaxKind.Identifier) {
      type = 'Identifier';
    } else if (nativeNode.kind === ts.SyntaxKind.CallExpression) {
      type = 'CallExpression';
    } else if (nativeNode.kind === ts.SyntaxKind.StringLiteral || nativeNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
      type = 'StringLiteral';
    } else if (nativeNode.kind === ts.SyntaxKind.NumericLiteral) {
      type = 'NumericLiteral';
    } else if (nativeNode.kind === ts.SyntaxKind.VariableDeclaration) {
      type = 'VariableDeclaration';
    } else if (nativeNode.kind === ts.SyntaxKind.FunctionDeclaration) {
      type = 'FunctionDeclaration';
    } else if (nativeNode.kind === ts.SyntaxKind.MethodDeclaration) {
      type = 'MethodDeclaration';
    } else if (nativeNode.kind === ts.SyntaxKind.ClassDeclaration) {
      type = 'ClassDeclaration';
    } else if (nativeNode.kind === ts.SyntaxKind.SourceFile) {
      type = 'SourceFile';
    }

    const novoNode: NovoNode = {
      type,
      kind: ts.SyntaxKind[nativeNode.kind],
      location,
      children: [],
      parent,
      metadata: new Map<string, any>(),
      language,
      rawReference: {
        ref: nativeNode,
        kind: ts.SyntaxKind[nativeNode.kind]
      }
    };

    // Populate metadata
    if (ts.isIdentifier(nativeNode)) {
      novoNode.metadata.set('name', nativeNode.text);
    } else if (ts.isStringLiteral(nativeNode) || ts.isNoSubstitutionTemplateLiteral(nativeNode)) {
      novoNode.metadata.set('value', nativeNode.text);
    } else if (ts.isNumericLiteral(nativeNode)) {
      novoNode.metadata.set('value', Number(nativeNode.text));
    }

    // Normalize children recursively
    const children: NovoNode[] = [];
    nativeNode.forEachChild(child => {
      children.push(this.normalizeNode(child, language, source, novoNode));
    });
    novoNode.children = children;

    return novoNode;
  }
}
