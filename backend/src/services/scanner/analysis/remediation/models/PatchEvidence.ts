export interface PatchEvidence {
  readonly evidenceId: string;
  readonly type: 'compilation' | 'symbolic' | 'syntax' | 'framework';
  readonly verified: boolean;
}
