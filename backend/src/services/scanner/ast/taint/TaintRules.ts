export interface TaintSourceRule {
  readonly id: string;
  readonly name: string;
  readonly type: 'Environment' | 'Http' | 'Input' | 'File' | 'Network' | 'Custom';
  match(label: string): boolean;
}

export interface TaintSanitizerRule {
  readonly id: string;
  readonly name: string;
  match(label: string): boolean;
}

export interface TaintSinkRule {
  readonly id: string;
  readonly name: string;
  match(label: string): boolean;
}

export class TaintRegistry {
  public sources: TaintSourceRule[] = [
    {
      id: 'src-env',
      name: 'process.env',
      type: 'Environment',
      match: (lbl) => lbl.includes('process.env')
    },
    {
      id: 'src-http',
      name: 'HTTP Parameters',
      type: 'Http',
      match: (lbl) => lbl.includes('req.query') || lbl.includes('req.body') || lbl.includes('req.params') || lbl.includes('req.headers')
    },
    {
      id: 'src-input',
      name: 'User Input / stdin',
      type: 'Input',
      match: (lbl) => lbl.startsWith('stdin') || lbl.includes('process.openStdin')
    }
  ];

  public sanitizers: TaintSanitizerRule[] = [
    {
      id: 'san-derive',
      name: 'Key Derivation PBKDF2/scrypt',
      match: (lbl) => lbl.startsWith('pbkdf2(') || lbl.startsWith('scrypt(') || lbl.startsWith('crypto.pbkdf2') || lbl.startsWith('crypto.scrypt')
    },
    {
      id: 'san-validate',
      name: 'Input Validation',
      match: (lbl) => lbl.startsWith('validate(') || lbl.startsWith('sanitize(')
    }
  ];

  public sinks: TaintSinkRule[] = [
    {
      id: 'sink-cipher',
      name: 'crypto.createCipheriv',
      match: (lbl) => lbl.includes('createCipher') || lbl.includes('createDecipher')
    },
    {
      id: 'sink-encrypt',
      name: 'Asymmetric Cryptography',
      match: (lbl) => lbl.includes('privateEncrypt') || lbl.includes('publicEncrypt') || lbl.includes('privateDecrypt') || lbl.includes('publicDecrypt')
    },
    {
      id: 'sink-jwt',
      name: 'JWT Signing',
      match: (lbl) => lbl.includes('jwt.sign') || lbl.includes('signToken')
    }
  ];

  public registerSource(rule: TaintSourceRule): void {
    this.sources.push(rule);
  }

  public registerSanitizer(rule: TaintSanitizerRule): void {
    this.sanitizers.push(rule);
  }

  public registerSink(rule: TaintSinkRule): void {
    this.sinks.push(rule);
  }
}
