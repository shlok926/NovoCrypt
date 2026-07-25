import * as fs from 'fs';
import * as path from 'path';
import { Workspace } from '../workspace/Workspace';
import { IgnoreMatcher } from './IgnoreMatcher';
import { FileDiscovery, DiscoveryOptions } from './FileDiscovery';
import { WorkspaceLoader } from './WorkspaceLoader';

export class RepositoryScanner {
  public scan(root: string, customIgnores: readonly string[] = [], options: DiscoveryOptions = {}): Workspace {
    const gitignorePath = path.join(root, '.gitignore');
    const ignoreRules = [...customIgnores];
    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        ignoreRules.push(...content.split(/\r?\n/));
      } catch (e) {
        // Fallback if read fails
      }
    }

    const matcher = new IgnoreMatcher(ignoreRules);
    const discovery = new FileDiscovery();
    const discoveredFiles = discovery.discover([root], matcher, options);

    return WorkspaceLoader.loadWorkspace(root, discoveredFiles);
  }
}
