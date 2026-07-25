import * as path from 'path';

export class IgnoreMatcher {
  private patterns: { pattern: RegExp; negate: boolean }[] = [];

  constructor(customRules: readonly string[] = []) {
    this.addPatterns(customRules);
  }

  public addPatterns(rules: readonly string[]): void {
    for (const rule of rules) {
      const trimmed = rule.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      let negate = false;
      let rawPattern = trimmed;

      if (trimmed.startsWith('!')) {
        negate = true;
        rawPattern = trimmed.substring(1).trim();
      }

      // Convert Git ignore glob format to standard RegExp
      // Escape special characters except '*', '?', and directory matches
      let regexStr = rawPattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex specials
        .replace(/\*/g, '.*')                 // '*' maps to '.*'
        .replace(/\?/g, '.');                 // '?' maps to '.'

      // If pattern ends with '/', match any contents inside directory
      if (rawPattern.endsWith('/')) {
        regexStr += '.*';
      } else {
        regexStr += '(?:$|\\/.*)';
      }

      // If pattern does not start with '/', match anywhere in path
      if (!rawPattern.startsWith('/')) {
        regexStr = '(?:^|\\/)' + regexStr;
      } else {
        regexStr = '^' + regexStr.substring(1);
      }

      try {
        this.patterns.push({
          pattern: new RegExp(regexStr),
          negate
        });
      } catch (e) {
        console.warn(`Failed to parse ignore glob pattern: '${trimmed}'`, e);
      }
    }
  }

  public isIgnored(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    let ignored = false;

    for (const p of this.patterns) {
      if (p.pattern.test(normalized)) {
        ignored = !p.negate;
      }
    }

    return ignored;
  }
}
