import fs from 'fs/promises';
import path from 'path';
import { WorkspaceManager } from './WorkspaceManager';

export interface AcquisitionResult {
  workspacePath: string;
  files: AsyncIterableIterator<string>;
  cleanup: () => Promise<void>;
}

export interface AcquisitionLimits {
  maxDepth?: number;
  maxFiles?: number;
}

export class TargetAcquisitionService {
  private workspaceManager = new WorkspaceManager();
  
  // Enterprise binary filters
  private binaryExtensions = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf',
    '.exe', '.dll', '.jar', '.zip', '.tar', '.gz',
    '.mp4', '.mov', '.avi', '.iso', '.bin', '.db', '.sqlite'
  ]);
  private async parseGitIgnore(dir: string): Promise<string[]> {
    try {
      const content = await fs.readFile(path.join(dir, '.gitignore'), 'utf-8');
      return content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        // Basic conversion of gitignore to js regex/includes logic
        .map(line => line.replace(/\*/g, '')); 
    } catch {
      return []; // No .gitignore found
    }
  }

  // Async generator to yield file paths iteratively, avoiding memory blowup
  private async *walkDirectory(
    dir: string, 
    limits: AcquisitionLimits,
    signal?: AbortSignal,
    currentDepth: number = 0,
    state = { fileCount: 0 }
  ): AsyncIterableIterator<string> {
    const maxDepth = limits.maxDepth || 50;
    const maxFiles = limits.maxFiles || 100000;

    if (signal?.aborted) {
      console.log(`[Acquisition] Walk aborted at ${dir}`);
      return;
    }

    if (currentDepth > maxDepth) {
      console.warn(`[Acquisition] Max traversal depth (${maxDepth}) exceeded at ${dir}`);
      return;
    }

    const ignores = await this.parseGitIgnore(dir);
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    
    for (const dirent of dirents) {
      if (signal?.aborted) return;
      
      // Ignore common non-source directories
      if (['.git', 'node_modules', 'dist', 'build', 'vendor', '.idea', '.vscode'].includes(dirent.name)) continue;
      
      // Basic .gitignore heuristic
      if (ignores.some(ignore => dirent.name.includes(ignore))) continue;
      
      const res = path.resolve(dir, dirent.name);
      
      if (dirent.isDirectory()) {
        yield* this.walkDirectory(res, limits, signal, currentDepth + 1, state);
      } else if (dirent.isFile()) {
        const ext = path.extname(dirent.name).toLowerCase();
        if (this.binaryExtensions.has(ext)) {
          // Skip binaries immediately
          continue;
        }

        state.fileCount++;
        if (state.fileCount > maxFiles) {
           console.warn(`[Acquisition] Max file count (${maxFiles}) exceeded. Terminating discovery.`);
           return;
        }

        yield res;
      }
      // Symlinks are intentionally ignored by default to prevent escape attacks
    }
  }

  public async acquire(
    jobId: string, 
    targetType: string, 
    targetValue: string, 
    limits: AcquisitionLimits = {},
    signal?: AbortSignal
  ): Promise<AcquisitionResult> {
    let workspacePath = '';
    
    if (targetType === 'git') {
      workspacePath = await this.workspaceManager.initializeWorkspace(jobId);
      if (signal?.aborted) throw new Error('Acquisition aborted before clone');
      
      // Can't easily pass AbortSignal to git clone in this stub, but could kill the process in real implementation
      await this.workspaceManager.acquireGitRepository(workspacePath, targetValue);
    } else if (targetType === 'local') {
      // For local testing/enterprise local mounts, just point to it. No cleanup required.
      workspacePath = path.resolve(targetValue);
      const stat = await fs.stat(workspacePath);
      if (!stat.isDirectory()) throw new Error('Local target is not a directory');
    } else {
      throw new Error(`Target type ${targetType} is currently unsupported by acquisition layer.`);
    }

    const fileIterator = this.walkDirectory(workspacePath, limits, signal);
    
    const cleanup = async () => {
      if (targetType === 'git') {
        await this.workspaceManager.cleanupWorkspace(jobId);
      }
    };

    return {
      workspacePath,
      files: fileIterator,
      cleanup
    };
  }
}
