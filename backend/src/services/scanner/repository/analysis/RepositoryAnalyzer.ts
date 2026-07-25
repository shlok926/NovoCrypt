import { Workspace } from '../workspace/Workspace';
import { WorkspaceGraph } from '../workspace/WorkspaceGraph';
import { WorkspaceIndex } from '../workspace/WorkspaceIndex';
import { DependencyGraph } from '../workspace/DependencyGraph';
import { AnalysisPipeline } from './AnalysisPipeline';
import { RepositoryConfiguration } from '../RepositoryConfiguration';

export class RepositoryAnalyzer {
  private pipeline = new AnalysisPipeline();

  public getPipeline(): AnalysisPipeline {
    return this.pipeline;
  }

  public async analyze(
    workspace: Workspace,
    config: RepositoryConfiguration
  ): Promise<{ findings: any[]; metrics: any; graph: WorkspaceGraph; index: WorkspaceIndex; dependencyGraph: DependencyGraph }> {
    return this.pipeline.executePipeline(workspace, config);
  }
}
