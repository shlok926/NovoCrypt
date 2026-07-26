export interface SanitizerMetadata {
  readonly name: string;
  readonly library: string;
}

export class SanitizerRecognizer {
  public static recognize(codeLines: string[]): SanitizerMetadata[] {
    const list: SanitizerMetadata[] = [];
    for (const line of codeLines) {
      if (line.includes('DOMPurify.sanitize')) {
        list.push({
          name: 'sanitize',
          library: 'dompurify'
        });
      }
      if (line.includes('express-validator')) {
        list.push({
          name: 'validationResult',
          library: 'express-validator'
        });
      }
      if (line.includes('ValidationPipe')) {
        list.push({
          name: 'ValidationPipe',
          library: '@nestjs/common'
        });
      }
    }
    return list;
  }
}
