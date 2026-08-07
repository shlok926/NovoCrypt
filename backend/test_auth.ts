import { verifyAccessToken, signAccessToken } from './src/utils/jwt.util';
import { requireAuth } from './src/middleware/auth.middleware';
import { AppError } from './src/middleware/error.middleware';

console.log("TESTING JWT PAYLOAD REJECTION");

try {
  // Test 1: Valid payload
  const validToken = signAccessToken({ userId: '123', email: 'test@example.com', role: 'ADMIN' });
  const req1: any = { headers: { authorization: `Bearer ${validToken}` } };
  let passed1 = false;
  requireAuth(req1, {} as any, () => { passed1 = true; });
  console.log("Valid JWT -> " + (passed1 ? "PASS" : "FAIL"));
  
  // Test 2: Invalid payload (missing userId)
  const invalidToken = signAccessToken({ email: 'test@example.com', role: 'ADMIN' } as any);
  const req2: any = { headers: { authorization: `Bearer ${invalidToken}` } };
  let passed2 = false;
  try {
    requireAuth(req2, {} as any, () => { passed2 = true; });
  } catch (err: any) {
    if (err instanceof AppError && err.message.includes('missing userId')) {
      console.log("Missing userId JWT -> PASS (Caught AppError)");
    } else {
      console.log("Missing userId JWT -> FAIL (Caught different error)");
    }
  }
} catch (e) {
  console.error("Test failed: ", e);
}
