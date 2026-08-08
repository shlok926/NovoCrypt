import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { signAccessToken } from '../../src/utils/jwt.util';
import { rbacService } from '../../src/services/rbac.service';
import { sessionService } from '../../src/services/session.service';

describe('RBAC Endpoints - Contract Tests', () => {
  it('GET /api/rbac/roles should return 401 Unauthorized if missing Authorization header', async () => {
    const res = await request(app).get('/api/rbac/roles');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/rbac/roles should return 403 Forbidden if user lacks roles:manage permission', async () => {
    vi.spyOn(rbacService, 'getUserPermissions').mockResolvedValue(['assets:read']);
    vi.spyOn(sessionService, 'isTokenBlacklisted').mockResolvedValue(false);

    const token = signAccessToken({ userId: 'unprivileged-user-id', email: 'unprivileged@example.com', role: 'USER' });

    const res = await request(app)
      .get('/api/rbac/roles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/rbac/roles should return 200 OK if user possesses roles:manage permission', async () => {
    vi.spyOn(rbacService, 'getUserPermissions').mockResolvedValue(['roles:manage']);
    vi.spyOn(rbacService, 'getRoles').mockResolvedValue([
      { id: 'role-1', code: 'ADMIN', name: 'Admin', description: null, isSystem: true, createdAt: new Date(), updatedAt: new Date(), permissions: [] }
    ] as any);
    vi.spyOn(sessionService, 'isTokenBlacklisted').mockResolvedValue(false);

    const token = signAccessToken({ userId: 'admin-user-id', email: 'admin@example.com', role: 'ADMIN' });

    const res = await request(app)
      .get('/api/rbac/roles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roles).toBeDefined();
  });
});
