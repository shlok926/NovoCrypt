import fs from 'fs/promises';
import path from 'path';
import { WorkspaceManager } from './WorkspaceManager';

export interface AcquisitionResult {
  workspacePath: string;
  files: AsyncIterableIterator<string>;
  cleanup: () => Promise<void>;
}

export class TargetAcquisitionService {
  private workspaceManager = new WorkspaceManager();

  // Async generator to yield file paths iteratively, avoiding memory blowup
  private async *walkDirectory(dir: string, maxDepth: number = 50, currentDepth: number = 0): AsyncIterableIterator<string> {
    if (currentDepth > maxDepth) {
      console.warn(`Max traversal depth exceeded at ${dir}`);
      return;
    }

    const dirents = await fs.readdir(dir, { withFileTypes: true });
    
    for (const dirent of dirents) {
      // Ignore common non-source directories
      if (['.git', 'node_modules', 'dist', 'build', 'vendor'].includes(dirent.name)) continue;
      
      const res = path.resolve(dir, dirent.name);
      
      if (dirent.isDirectory()) {
        yield* this.walkDirectory(res, maxDepth, currentDepth + 1);
      } else if (dirent.isFile()) {
        yield res;
      }
      // Symlinks are intentionally ignored by default to prevent escape attacks
    }
  }

  public async acquire(jobId: string, targetType: string, targetValue: string): Promise<AcquisitionResult> {
    let workspacePath = '';
    
    if (targetType === 'git') {
      workspacePath = await this.workspaceManager.initializeWorkspace(jobId);
      await this.workspaceManager.acquireGitRepository(workspacePath, targetValue);
    } else if (targetType === 'local') {
      // For local testing/enterprise local mounts, just point to it. No cleanup required.
      workspacePath = path.resolve(targetValue);
      const stat = await fs.stat(workspacePath);
      if (!stat.isDirectory()) throw new Error('Local target is not a directory');
    } else {
      throw new Error(`Target type ${targetType} is currently unsupported by acquisition layer.`);
    }

    const fileIterator = this.walkDirectory(workspacePath);
    
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
