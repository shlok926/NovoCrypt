import { FrameworkType } from './FrameworkModel';
import { FrameworkComponent } from './FrameworkComponent';

export class FrameworkMetadata {
  public readonly framework: FrameworkType;
  public readonly version?: string;
  public readonly plugins: readonly string[];
  public readonly entryPoints: readonly FrameworkComponent[];
  public readonly components: readonly FrameworkComponent[];
  public readonly metadata: ReadonlyMap<string, any>;

  constructor(options: {
    framework: FrameworkType;
    version?: string;
    plugins?: string[];
    entryPoints?: FrameworkComponent[];
    components?: FrameworkComponent[];
    metadata?: Map<string, any>;
  }) {
    this.framework = options.framework;
    this.version = options.version;
    this.plugins = options.plugins ? [...options.plugins] : [];
    this.entryPoints = options.entryPoints ? [...options.entryPoints] : [];
    this.components = options.components ? [...options.components] : [];
    this.metadata = options.metadata ? new Map(options.metadata) : new Map();
  }
}
