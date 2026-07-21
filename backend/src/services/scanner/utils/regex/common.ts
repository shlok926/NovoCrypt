export const COMMON_REGEX = {
  // Matches word boundaries or underscores for clean token lookups
  UNDERSCORE_BOUND: /(?:\b|_)/i,
  // Helper to construct boundary-safe regex patterns dynamically
  buildBoundPattern: (pattern: string): RegExp => {
    return new RegExp(`(?:\\b|_)${pattern}(?:\\b|_)`, 'i');
  }
};
