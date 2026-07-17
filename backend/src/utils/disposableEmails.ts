export const disposableDomains = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'yopmail.com',
  'nada.ltd',
  'getnada.com',
  'sharklasers.com',
  'spam4.me',
  'disposablemail.com',
  'temp-mail.com',
  'tempemail.co',
  'trashmail.com',
  'maildrop.cc'
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1].toLowerCase();
  return disposableDomains.has(domain);
}
