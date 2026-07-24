import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { Artifact } from '../schema/Run';

export class SarifArtifactMapper {
  public static mapArtifacts(findings: readonly FrameworkFinding[], baseUri?: string): Artifact[] {
    const files = new Set<string>();
    for (const f of findings) {
      const filename = f.executionPipeline.handler.metadata.get('filename') || 'unknown.ts';
      files.add(filename.replace(/\\/g, '/'));
    }

    return Array.from(files).map(filename => {
      const uri = baseUri ? `${baseUri}/${filename}` : filename;
      return {
        location: {
          uri: uri
        },
        roles: ['resultFile']
      };
    });
  }
}
