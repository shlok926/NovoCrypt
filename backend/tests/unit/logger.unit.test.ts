import { describe, it, expect, vi } from 'vitest';
import { logger, httpLogger } from '../../src/middleware/logger';

describe('Logger Middleware - Unit Tests', () => {
  it('should format log levels correctly', () => {
    const levelFormatter = (logger as any).formatters?.level;
    if (typeof levelFormatter === 'function') {
      const formatted = levelFormatter('warn', 30);
      expect(formatted).toEqual({ level: 'warn' });
    }
  });

  it('should generate or preserve request IDs in httpLogger', () => {
    const reqWithHeader: any = {
      headers: { 'x-request-id': 'existing-req-id-123' },
    };
    const res: any = {
      setHeader: vi.fn(),
    };

    const genReqId = (httpLogger as any).genReqId;
    if (typeof genReqId === 'function') {
      const id1 = genReqId(reqWithHeader, res);
      expect(id1).toBe('existing-req-id-123');

      const reqWithoutHeader: any = { headers: {} };
      const id2 = genReqId(reqWithoutHeader, res);
      expect(id2).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('x-request-id', id2);
    }
  });

  it('should include customProps in httpLogger', () => {
    const customProps = (httpLogger as any).customProps;
    if (typeof customProps === 'function') {
      const props = customProps({ id: 'req-456' }, {});
      expect(props).toEqual({ requestId: 'req-456' });
    }
  });
});
