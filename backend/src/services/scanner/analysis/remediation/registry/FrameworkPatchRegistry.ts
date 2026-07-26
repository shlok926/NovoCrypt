export interface FrameworkPatch {
  readonly id: string;
  readonly framework: string;
  readonly before: string;
  readonly after: string;
}

export class FrameworkPatchRegistry {
  private patches = new Map<string, FrameworkPatch>([
    [
      'express_helmet',
      {
        id: 'express_helmet',
        framework: 'Express',
        before: 'app.use(cors())',
        after: 'app.use(helmet());\napp.use(cors())'
      }
    ],
    [
      'react_inner_html',
      {
        id: 'react_inner_html',
        framework: 'React',
        before: 'dangerouslySetInnerHTML={{ __html: input }}',
        after: 'dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(input) }}'
      }
    ]
  ]);

  public getPatch(id: string): FrameworkPatch | undefined {
    return this.patches.get(id);
  }

  public registerPatch(patch: FrameworkPatch): void {
    this.patches.set(patch.id, patch);
  }
}
