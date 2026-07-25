import * as fs from 'fs';
import * as path from 'path';
import { IgnoreMatcher } from './IgnoreMatcher';
import { LanguageDetector } from './LanguageDetector';

export interface DiscoveryOptions {
  readonly maxDepth?: number;
  readonly followSymlinks?: boolean;
  readonly includeHidden?: boolean;
  readonly maxFileSize?: number; // In bytes
  readonly maxRepositorySize?: number; // Total processed size in bytes
}

export class FileDiscovery {
  private totalSize = 0;

  public discover(
    rootPaths: readonly string[],
    matcher: IgnoreMatcher,
    options: DiscoveryOptions = {}
  ): string[] {
    this.totalSize = 0;
    const files: string[] = [];
    const maxDepth = options.maxDepth ?? 50;
    const followSymlinks = options.followSymlinks ?? false;
    const includeHidden = options.includeHidden ?? false;
    const maxFileSize = options.maxFileSize ?? 10 * 1024 * 1024; // 10MB
    const maxRepoSize = options.maxRepositorySize ?? 500 * 1024 * 1024; // 500MB

    const visit = (currentPath: string, depth: number): void => {
      if (depth > maxDepth) return;

      let stat: fs.Stats;
      try {
        stat = followSymlinks ? fs.statSync(currentPath) : fs.lstatSync(currentPath);
      } catch (e) {
        // Skip files that cannot be read
        return;
      }

      // Check ignore matcher
      const relative = path.relative(rootPaths[0], currentPath);
      if (relative && matcher.isIgnored(relative)) {
        return;
      }

      const basename = path.basename(currentPath);
      if (!includeHidden && basename.startsWith('.') && basename !== '.') {
        return;
      }

      if (stat.isDirectory()) {
        let children: string[];
        try {
          children = fs.readdirSync(currentPath);
        } catch (e) {
          return;
        }

        for (const child of children) {
          visit(path.join(currentPath, child), depth + 1);
        }
      } else if (stat.isFile() || (stat.isSymbolicLink() && followSymlinks)) {
        if (stat.size > maxFileSize) {
          return; // Skip oversized files
        }
        if (this.totalSize + stat.size > maxRepoSize) {
          return; // Max repo size reached
        }

        if (LanguageDetector.isSupported(currentPath)) {
          files.push(path.resolve(currentPath).replace(/\\/g, '/'));
          this.totalSize += stat.size;
        }
      }
    };

    for (const root of rootPaths) {
      if (fs.existsSync(root)) {
        visit(root, 0);
      }
    }

    return files;
  }
}
