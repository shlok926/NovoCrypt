import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export class WorkspaceManager {
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = path.join(os.tmpdir(), 'novocrypt-scans');
  }

  public async initializeWorkspace(jobId: string): Promise<string> {
    const workspacePath = path.join(this.workspaceRoot, jobId);
    await fs.mkdir(workspacePath, { recursive: true });
    return workspacePath;
  }

  public async acquireGitRepository(workspacePath: string, repoUrl: string): Promise<void> {
    // Basic validation against command injection
    if (!repoUrl.match(/^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/)) {
      throw new Error('Invalid Git URL provided for acquisition.');
    }
    
    // Perform shallow clone to minimize network and disk overhead
    const command = `git clone --depth 1 ${repoUrl} .`;
    await execAsync(command, { cwd: workspacePath, timeout: 60000 }); // 60s timeout
  }

  public async cleanupWorkspace(jobId: string): Promise<void> {
    const workspacePath = path.join(this.workspaceRoot, jobId);
    try {
      await fs.rm(workspacePath, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to cleanup workspace ${workspacePath}:`, err);
    }
  }
}
