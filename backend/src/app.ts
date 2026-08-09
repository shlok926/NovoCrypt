import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import routes from './routes';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { WorkerService } from './services/jobs/WorkerService';
import { httpLogger } from './middleware/logger';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all localhost and 127.0.0.1 origins regardless of port
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        callback(null, true);
      } else if (env.NODE_ENV === 'development') {
        // In development, also allow the configured CORS origin
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
function sanitizeRequestId(headerValue: unknown): string {
  if (typeof headerValue !== 'string') return crypto.randomUUID();
  const trimmed = headerValue.trim();
  if (trimmed.length === 0 || trimmed.length > 64) return crypto.randomUUID();
  // Safe character set: alphanumeric, hyphen, underscore, dot
  if (!/^[a-zA-Z0-9\-_.]+$/.test(trimmed)) return crypto.randomUUID();
  return trimmed;
}

app.use((req, res, next) => {
  const rawId = (req as any).id || req.headers['x-request-id'];
  const reqId = sanitizeRequestId(rawId);
  (req as any).id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
});
app.use(httpLogger);
app.use(metricsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiRateLimiter);

// Serve Swagger UI documentation in non-production environments
const openapiPath = [
  path.resolve(__dirname, '../../docs/openapi.yaml'),
  path.resolve(__dirname, '../docs/openapi.yaml'),
  path.resolve(process.cwd(), '../docs/openapi.yaml'),
  path.resolve(process.cwd(), 'docs/openapi.yaml'),
].find((p) => fs.existsSync(p));

if (openapiPath) {
  const openapiFile = fs.readFileSync(openapiPath, 'utf8');
  const openapiDocument = YAML.parse(openapiFile);
  if (env.NODE_ENV !== 'production') {
    app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  }
}

app.get('/metrics', metricsEndpoint);
app.use(['/api/v1', '/api'], routes);
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize background workers
WorkerService.initializeWorkers();

export default app;
