import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Health API Integration', () => {
  it('should return 200 OK from /api/health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'ok');
  });
});
