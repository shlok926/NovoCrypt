import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../../src/utils/jwt.util';

describe('JWT Utilities', () => {
  const payload = {
    userId: '12345',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  it('should successfully sign and verify a token with auto-generated jti', () => {
    const token = signAccessToken(payload);
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3); // JWT format Header.Payload.Signature

    const verified = verifyAccessToken(token);
    expect(verified).toMatchObject({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
    expect(verified.jti).toBeDefined();
    expect(verified.jti).toBeTypeOf('string');
  });

  it('should throw an error for invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });
});
