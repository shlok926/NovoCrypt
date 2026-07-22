import * as ts from 'typescript';
import { NovoNode } from './NovoNode';
import { Symbol } from './Symbol';
import { Type, Types } from './Type';
import { SymbolTable } from './SymbolTable';

export class TypeResolver {
  private cache = new Map<NovoNode, Type>();
  private symbolTable: SymbolTable;

  constructor(symbolTable: SymbolTable) {
    this.symbolTable = symbolTable;
  }

  public resolveType(node: NovoNode): Type {
    const cached = this.cache.get(node);
    if (cached) return cached;

    let type: Type = Types.Unknown;

    if (node.type === 'NumericLiteral') {
      type = Types.createLiteral(node.metadata.get('value'), 'Number');
    } 
    else if (node.type === 'StringLiteral') {
      type = Types.createLiteral(node.metadata.get('value'), 'String');
    } 
    else if (node.type === 'TrueKeyword' || node.type === 'FalseKeyword' || node.kind === 'TrueKeyword' || node.kind === 'FalseKeyword') {
      type = Types.createLiteral(node.type === 'TrueKeyword' || node.kind === 'TrueKeyword', 'Boolean');
    }
    else if (node.type === 'VariableDeclaration' || node.type === 'Parameter') {
      type = this.resolveDeclarationType(node);
    } 
    else if (node.type === 'FunctionDeclaration' || node.type === 'MethodDeclaration' || node.type === 'ArrowFunction') {
      type = Types.createFunction(this.resolveReturnType(node));
    } 
    else if (node.type === 'Identifier') {
      type = this.resolveIdentifierType(node);
    } 
    else if (node.type === 'CallExpression') {
      type = this.resolveCallExpressionType(node);
    } 
    else if (node.type === 'BinaryExpression') {
      type = this.resolveBinaryExpressionType(node);
    } 
    else if (node.type === 'ArrayLiteralExpression') {
      type = this.resolveArrayLiteralType(node);
    } 
    else if (node.type === 'ObjectLiteralExpression') {
      type = Types.Object;
    } 
    else if (node.type === 'AwaitExpression') {
      type = this.resolveAwaitExpressionType(node);
    }

    this.cache.set(node, type);
    return type;
  }

  public resolveSymbolType(symbol: Symbol): Type {
    return this.resolveType(symbol.declaration);
  }

  public resolveExpressionType(node: NovoNode): Type {
    return this.resolveType(node);
  }

  public resolveReturnType(functionNode: NovoNode): Type {
    const nativeNode = functionNode.rawReference?.ref as any;
    if (!nativeNode) return Types.Unknown;

    // 1. Explicit annotation return type
    if (nativeNode.type) {
      return this.parseExplicitType(nativeNode.type);
    }

    // 2. Implicit inference from return statements in function body
    let foundReturnType: Type = Types.Undefined; // default for void/no returns
    const checkReturn = (n: ts.Node) => {
      if (ts.isReturnStatement(n)) {
        if (n.expression) {
          const novoRetExpr = this.findNovoNode(n.expression, functionNode);
          if (novoRetExpr) {
            foundReturnType = this.resolveType(novoRetExpr);
          } else {
            foundReturnType = Types.Any;
          }
        } else {
          foundReturnType = Types.Undefined;
        }
      }
      ts.forEachChild(n, checkReturn);
    };

    if (nativeNode.body) {
      checkReturn(nativeNode.body);
    }

    return foundReturnType;
  }

  private resolveDeclarationType(node: NovoNode): Type {
    const nativeNode = node.rawReference?.ref as any;
    if (!nativeNode) return Types.Unknown;

    // Explicit type annotation
    if (nativeNode.type) {
      return this.parseExplicitType(nativeNode.type);
    }

    // Implicit initializer type inference
    if (nativeNode.initializer) {
      const initializerNovo = this.findNovoNode(nativeNode.initializer, node);
      if (initializerNovo) {
        return this.resolveType(initializerNovo);
      }
    }

    return Types.Unknown;
  }

  private resolveIdentifierType(node: NovoNode): Type {
    const name = node.metadata.get('name');
    if (!name) return Types.Unknown;

    // Lookup symbol
    const symbol = this.symbolTable.findByDeclaration(node) || this.symbolTable.getAllSymbols().find(s => s.name === name);
    if (symbol) {
      return this.resolveType(symbol.declaration);
    }

    return Types.Unknown;
  }

  private resolveCallExpressionType(node: NovoNode): Type {
    const nativeNode = node.rawReference?.ref as any;
    if (!nativeNode) return Types.Unknown;

    if (ts.isCallExpression(nativeNode)) {
      const expr = nativeNode.expression;
      if (ts.isIdentifier(expr)) {
        const symbol = this.symbolTable.getAllSymbols().find(s => s.name === expr.text);
        if (symbol && (symbol.kind === 'Function' || symbol.kind === 'Method')) {
          return this.resolveReturnType(symbol.declaration);
        }
      }
    }

    return Types.Unknown;
  }

  private resolveBinaryExpressionType(node: NovoNode): Type {
    const nativeNode = node.rawReference?.ref as any;
    if (!nativeNode) return Types.Unknown;

    if (ts.isBinaryExpression(nativeNode)) {
      const op = nativeNode.operatorToken.kind;
      if (op === ts.SyntaxKind.PlusToken) {
        const leftNovo = this.findNovoNode(nativeNode.left, node);
        const rightNovo = this.findNovoNode(nativeNode.right, node);
        const leftType = leftNovo ? this.resolveExpressionType(leftNovo) : Types.Unknown;
        const rightType = rightNovo ? this.resolveExpressionType(rightNovo) : Types.Unknown;
        if (leftType.kind === 'String' || rightType.kind === 'String' || (leftType.kind === 'Literal' && typeof leftType.value === 'string') || (rightType.kind === 'Literal' && typeof rightType.value === 'string')) {
          return Types.String;
        }
      }
      if (op === ts.SyntaxKind.EqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsEqualsToken) {
        return Types.Boolean;
      }
    }

    return Types.Unknown;
  }

  private resolveArrayLiteralType(node: NovoNode): Type {
    const nativeNode = node.rawReference?.ref as any;
    if (!nativeNode) return Types.Unknown;

    if (ts.isArrayLiteralExpression(nativeNode) && nativeNode.elements.length > 0) {
      const firstNovo = this.findNovoNode(nativeNode.elements[0], node);
      if (firstNovo) {
        return Types.createArray(this.resolveType(firstNovo));
      }
    }

    return Types.createArray(Types.Unknown);
  }

  private resolveAwaitExpressionType(node: NovoNode): Type {
    const nativeNode = node.rawReference?.ref as any;
    if (!nativeNode) return Types.Unknown;

    if (ts.isAwaitExpression(nativeNode)) {
      const promiseNovo = this.findNovoNode(nativeNode.expression, node);
      if (promiseNovo) {
        const innerType = this.resolveType(promiseNovo);
        if (innerType.kind === 'Promise' && innerType.returnType) {
          return innerType.returnType;
        }
        return innerType;
      }
    }
    return Types.Unknown;
  }

  private parseExplicitType(typeNode: ts.TypeNode): Type {
    if (ts.isTypeReferenceNode(typeNode)) {
      const typeName = typeNode.typeName;
      if (ts.isIdentifier(typeName)) {
        const name = typeName.text;
        if (name === 'Buffer') return Types.Buffer;
        if (name === 'Uint8Array') return Types.Uint8Array;
        if (name === 'Promise') {
          const typeArg = typeNode.typeArguments?.[0];
          return Types.createPromise(typeArg ? this.parseExplicitType(typeArg) : Types.Unknown);
        }
      }
    }

    const kind = typeNode.kind;
    if (kind === ts.SyntaxKind.StringKeyword) return Types.String;
    if (kind === ts.SyntaxKind.NumberKeyword) return Types.Number;
    if (kind === ts.SyntaxKind.BooleanKeyword) return Types.Boolean;
    if (kind === ts.SyntaxKind.BigIntKeyword) return Types.BigInt;
    if (kind === ts.SyntaxKind.NullKeyword) return Types.Null;
    if (kind === ts.SyntaxKind.UndefinedKeyword) return Types.Undefined;
    if (kind === ts.SyntaxKind.AnyKeyword) return Types.Any;
    if (kind === ts.SyntaxKind.NeverKeyword) return Types.Never;
    if (kind === ts.SyntaxKind.UnknownKeyword) return Types.Unknown;

    if (ts.isUnionTypeNode(typeNode)) {
      return Types.createUnion(typeNode.types.map(t => this.parseExplicitType(t)));
    }
    if (ts.isIntersectionTypeNode(typeNode)) {
      return Types.createIntersection(typeNode.types.map(t => this.parseExplicitType(t)));
    }
    if (ts.isArrayTypeNode(typeNode)) {
      return Types.createArray(this.parseExplicitType(typeNode.elementType));
    }
    if (ts.isTupleTypeNode(typeNode)) {
      return Types.createTuple(typeNode.elements.map(t => this.parseExplicitType(t)));
    }

    return Types.Unknown;
  }

  private findNovoNode(nativeTarget: ts.Node, startNode: NovoNode): NovoNode | undefined {
    const visit = (curr: NovoNode): NovoNode | undefined => {
      if (curr.rawReference?.ref === nativeTarget) {
        return curr;
      }
      for (const child of curr.children) {
        const res = visit(child);
        if (res) return res;
      }
      return undefined;
    };

    let root = startNode;
    while (root.parent) {
      root = root.parent;
    }
    return visit(root);
  }

  public clear(): void {
    this.cache.clear();
  }
}
