import { SecureAlternative } from '../models/SecureAlternative';

export class SecureApiRegistry {
  private alternatives = new Map<string, SecureAlternative>([
    [
      'eval',
      {
        unsafeApi: 'eval()',
        secureApi: 'JSON.parse()',
        example: 'eval(userInput) => JSON.parse(userInput)'
      }
    ],
    [
      'innerHTML',
      {
        unsafeApi: 'innerHTML',
        secureApi: 'textContent',
        example: 'element.innerHTML = val => element.textContent = val'
      }
    ]
  ]);

  public getAlternative(name: string): SecureAlternative | undefined {
    return this.alternatives.get(name);
  }

  public registerAlternative(alt: SecureAlternative): void {
    this.alternatives.set(alt.unsafeApi, alt);
  }
}
