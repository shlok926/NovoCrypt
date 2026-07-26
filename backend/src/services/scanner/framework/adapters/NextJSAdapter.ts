import { FrameworkAdapter } from '../registry/FrameworkRegistry';

export class NextJSAdapter implements FrameworkAdapter {
  public readonly name = 'NextJS';

  public detect(codeLines: string[]): boolean {
    return codeLines.some(l => l.includes('next/router') || l.includes('next/link') || l.includes('export async function GET'));
  }

  public getEndpoints(codeLines: string[]): any[] {
    return codeLines.filter(l => l.includes('export async function GET') || l.includes('export async function POST'));
  }

  public getMiddlewares(codeLines: string[]): any[] {
    return codeLines.filter(l => l.includes('export function middleware'));
  }
}
