import * as path from 'path';
import { SymbolTable } from '../../ast/SymbolTable';
import { ScopeManager } from '../../ast/ScopeManager';


export interface SymbolLink {
  readonly sourceFile: string;
  readonly sourceSymbol: string;
  readonly targetFile: string;
  readonly targetSymbol: string;
}

export class CrossFileResolver {
  private links: SymbolLink[] = [];
  private importToExportMap = new Map<string, SymbolLink>(); // "file:importSymbol" -> SymbolLink

  public resolveSymbol(
    fromFile: string,
    symbolName: string,
    specifier: string,
    symbolTables: Map<string, SymbolTable>
  ): SymbolLink | undefined {
    // Resolve relative path to target file
    const resolvedPath = this.resolvePath(fromFile, specifier);
    const targetTable = symbolTables.get(resolvedPath);
    if (!targetTable) return undefined;

    // Check if target symbol is exported in target file
    const targetSymbol = targetTable.getExports().find(s => s.name === symbolName);

    
    const link: SymbolLink = {
      sourceFile: fromFile.replace(/\\/g, '/'),
      sourceSymbol: symbolName,
      targetFile: resolvedPath.replace(/\\/g, '/'),
      targetSymbol: symbolName
    };

    this.links.push(link);
    this.importToExportMap.set(`${link.sourceFile}:${link.sourceSymbol}`, link);
    return link;
  }

  public getLink(file: string, symbol: string): SymbolLink | undefined {
    const normalized = file.replace(/\\/g, '/');
    return this.importToExportMap.get(`${normalized}:${symbol}`);
  }

  public getAllLinks(): readonly SymbolLink[] {
    return this.links;
  }

  public clear(): void {
    this.links = [];
    this.importToExportMap.clear();
  }

  private resolvePath(fromFile: string, specifier: string): string {
    const dir = path.dirname(fromFile);
    let resolved = path.resolve(dir, specifier);
    
    // Resolve standard Node/TS extensions if not specified
    if (!path.extname(resolved)) {
      if (fsExists(resolved + '.ts')) resolved += '.ts';
      else if (fsExists(resolved + '.tsx')) resolved += '.tsx';
      else if (fsExists(resolved + '.js')) resolved += '.js';
      else if (fsExists(resolved + '.jsx')) resolved += '.jsx';
    }
    return resolved.replace(/\\/g, '/');
  }
}

function fsExists(p: string): boolean {
  try {
    const fs = require('fs');
    return fs.existsSync(p);
  } catch (e) {
    return false;
  }
}
