import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export class WorkspaceManager {
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = path.join(os.tmpdir(), 'novocrypt-scans');
  }

  public async initializeWorkspace(jobId: string): Promise<string> {
    const workspacePath = path.join(this.workspaceRoot, jobId, 'repository');
    await fs.mkdir(workspacePath, { recursive: true });
    return workspacePath;
  }

  public async acquireGitRepository(workspacePath: string, repoUrl: string): Promise<void> {
    // Strict URL validation
    if (!repoUrl.match(/^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/)) {
      throw new Error('Invalid Git URL provided for acquisition.');
    }
    
    return new Promise((resolve, reject) => {
      const gitProcess = spawn('git', ['clone', '--depth', '1', repoUrl, '.'], {
        cwd: workspacePath,
        stdio: 'ignore' // We don't want to leak credentials from stderr/stdout
      });

      const timeout = setTimeout(() => {
        gitProcess.kill('SIGKILL');
        reject(new Error('Git clone timed out after 60 seconds'));
      }, 60000);

      gitProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(`Git clone failed with exit code ${code}`));
      });
      
      gitProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Git process error: ${err.message}`));
      });
    });
  }

  public async cleanupWorkspace(jobId: string): Promise<void> {
    const jobRoot = path.join(this.workspaceRoot, jobId);
    let retries = 3;
    
    while (retries > 0) {
      try {
        await fs.rm(jobRoot, { recursive: true, force: true });
        return;
      } catch (err) {
        retries--;
        if (retries === 0) {
          console.error(`[WorkspaceManager] Failed to cleanup workspace ${jobRoot} permanently:`, err);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
}
