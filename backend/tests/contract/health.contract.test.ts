import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Health API Contract', () => {
  it('should match the expected contract for /api/health', async () => {
    const response = await request(app).get('/api/health');
    
    // Status Code Contract
    expect(response.status).toBe(200);
    
    // Header Contract
    expect(response.headers['content-type']).toMatch(/application\/json/);
    
    // Schema Contract
    expect(response.body).toEqual({
      success: expect.any(Boolean),
      data: {
        status: expect.any(String),
        service: expect.any(String),
        timestamp: expect.any(String),
      }
    });
  });
});
