import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import app from '../../src/app';
import { signAccessToken } from '../../src/utils/jwt.util';

describe('OpenAPI & Enterprise API Governance Contract Tests', () => {
  const openapiPath = [
    path.resolve(__dirname, '../../../docs/openapi.yaml'),
    path.resolve(__dirname, '../../docs/openapi.yaml'),
    path.resolve(process.cwd(), '../docs/openapi.yaml'),
    path.resolve(process.cwd(), 'docs/openapi.yaml'),
  ].find((p) => fs.existsSync(p)) as string;

  const rawYaml = fs.readFileSync(openapiPath, 'utf8');
  const openapiDoc = YAML.parse(rawYaml);

  function resolveRef(doc: any, ref: string): any {
    if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null;
    const parts = ref.replace('#/', '').split('/');
    let current = doc;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }
    return current;
  }

  function validateSchema(doc: any, schema: any, data: any, pathName: string): void {
    if (!schema) throw new Error(`Schema undefined for ${pathName}`);
    if (schema.$ref) {
      const resolved = resolveRef(doc, schema.$ref);
      if (!resolved) throw new Error(`Failed to resolve ref ${schema.$ref} for ${pathName}`);
      return validateSchema(doc, resolved, data, pathName);
    }

    if (schema.type === 'object') {
      expect(typeof data, `Expected object for ${pathName}, got ${typeof data}`).toBe('object');
      expect(data, `Expected non-null object for ${pathName}`).not.toBeNull();

      if (schema.required && Array.isArray(schema.required)) {
        for (const requiredProp of schema.required) {
          expect(
            data,
            `Missing required property '${requiredProp}' in response for ${pathName}`,
          ).toHaveProperty(requiredProp);
        }
      }

      if (schema.properties) {
        for (const [propName, propSchema] of Object.entries<any>(schema.properties)) {
          if (data[propName] !== undefined) {
            validateSchema(doc, propSchema, data[propName], `${pathName}.${propName}`);
          }
        }
      }
    } else if (schema.type === 'boolean') {
      expect(typeof data, `Expected boolean for ${pathName}`).toBe('boolean');
    } else if (schema.type === 'string') {
      expect(typeof data, `Expected string for ${pathName}`).toBe('string');
    } else if (schema.type === 'number' || schema.type === 'integer') {
      expect(typeof data, `Expected number for ${pathName}`).toBe('number');
    } else if (schema.type === 'array') {
      expect(Array.isArray(data), `Expected array for ${pathName}`).toBe(true);
      if (schema.items && Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          validateSchema(doc, schema.items, data[i], `${pathName}[${i}]`);
        }
      }
    }
  }

  function validateContractResponse(
    doc: any,
    apiPath: string,
    method: string,
    statusCode: number,
    responseBody: any,
  ): void {
    const pathItem = doc.paths[apiPath];
    expect(pathItem, `OpenAPI path ${apiPath} not found in spec`).toBeDefined();

    const operation = pathItem[method.toLowerCase()];
    expect(
      operation,
      `OpenAPI operation ${method.toUpperCase()} ${apiPath} not found in spec`,
    ).toBeDefined();

    const responseDef =
      operation.responses[statusCode] ||
      operation.responses[String(statusCode)] ||
      operation.responses['default'];
    expect(
      responseDef,
      `OpenAPI response status ${statusCode} not defined for ${method.toUpperCase()} ${apiPath}`,
    ).toBeDefined();

    let schema = responseDef.content?.['application/json']?.schema;
    if (!schema && responseDef.$ref) {
      const resolvedResponse = resolveRef(doc, responseDef.$ref);
      schema = resolvedResponse?.content?.['application/json']?.schema;
    }

    expect(
      schema,
      `OpenAPI schema not defined for ${method.toUpperCase()} ${apiPath} status ${statusCode}`,
    ).toBeDefined();

    validateSchema(doc, schema, responseBody, `${method.toUpperCase()} ${apiPath}`);
  }

  it('should load and successfully parse canonical OpenAPI 3.1 specification (docs/openapi.yaml)', () => {
    expect(fs.existsSync(openapiPath)).toBe(true);
    expect(openapiDoc).toBeDefined();
    expect(openapiDoc.openapi).toMatch(/^3\.1\./);
    expect(openapiDoc.info.title).toBe('NovoCrypt Backend API Platform');
    expect(openapiDoc.paths['/health']).toBeDefined();
    expect(openapiDoc.paths['/auth/login']).toBeDefined();
    expect(openapiDoc.paths['/rbac/roles']).toBeDefined();
  });

  it('should return 200 OK and conform to OpenAPI HealthResponse schema on GET /api/v1/health', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
    validateContractResponse(openapiDoc, '/health', 'get', 200, res.body);
  });

  it('should return 200 OK, conform to HealthResponse schema, and emit Deprecation header on legacy GET /api/health', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['deprecation']).toBe('true');
    validateContractResponse(openapiDoc, '/health', 'get', 200, res.body);
  });

  it('should return 200 OK and serve Swagger UI at GET /api/v1/docs/ in non-production', async () => {
    const res = await request(app).get('/api/v1/docs/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });

  it('should return 404 and conform to OpenAPI ErrorEnvelope schema for non-existent routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    validateContractResponse(openapiDoc, '/health', 'get', 500, res.body);
  });

  it('should return 401 and conform to OpenAPI ErrorEnvelope schema for unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
    validateContractResponse(openapiDoc, '/auth/me', 'get', 401, res.body);
  });

  it('should return 400 and conform to OpenAPI ErrorEnvelope schema for Zod validation failures', async () => {
    const token = signAccessToken({
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'test@novocrypt.com',
      role: 'ADMIN',
    });

    const res = await request(app)
      .post('/api/v1/risk/calculate')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    validateContractResponse(openapiDoc, '/auth/register', 'post', 400, res.body);
  });

  describe('X-Request-ID Trust Boundary Tests', () => {
    it('CASE A: should generate valid UUID when no X-Request-ID is supplied', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('CASE B: should accept and echo valid X-Request-ID', async () => {
      const validId = 'client-req-id-1234567890';
      const res = await request(app).get('/api/v1/health').set('X-Request-ID', validId);
      expect(res.headers['x-request-id']).toBe(validId);
    });

    it('CASE C: should reject oversized X-Request-ID and generate a safe fallback UUID', async () => {
      const oversizedId = 'a'.repeat(100);
      const res = await request(app).get('/api/v1/health').set('X-Request-ID', oversizedId);
      expect(res.headers['x-request-id']).not.toBe(oversizedId);
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('CASE D: should reject malformed / dangerous X-Request-ID (script/spaces/quotes) and generate a safe fallback UUID', async () => {
      const dangerousId = 'bad_id<script>alert(1)</script> "with spaces"';
      const res = await request(app).get('/api/v1/health').set('X-Request-ID', dangerousId);
      expect(res.headers['x-request-id']).not.toBe(dangerousId);
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });
});
