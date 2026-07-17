import disposableDomainsList from 'disposable-email-domains';

const disposableDomains = new Set(disposableDomainsList);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return true;
  const domain = email.split('@')[1].toLowerCase();
  return disposableDomains.has(domain);
}

