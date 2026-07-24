import { NovoNode } from '../../ast/NovoNode';
import { Location } from '../schema/Location';

export class SarifLocationMapper {
  public static mapLocation(node: NovoNode, filename: string, baseUri?: string): Location {
    const loc = node.location;
    const uri = baseUri ? `${baseUri}/${filename}` : filename;

    return {
      physicalLocation: {
        artifactLocation: {
          uri: uri.replace(/\\/g, '/')
        },
        region: {
          startLine: loc.startLine,
          startColumn: loc.startColumn || 1,
          endLine: loc.endLine || loc.startLine,
          endColumn: loc.endColumn || loc.startColumn || 1
        }
      }
    };
  }
}
