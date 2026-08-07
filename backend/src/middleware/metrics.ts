import promClient from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Enable default metrics (CPU, Memory, Event Loop, GC)
promClient.collectDefaultMetrics();

export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });
    
    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route: route,
        status_code: res.statusCode,
      },
      durationInSeconds
    );
  });
  
  next();
};

export const metricsEndpoint = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.end(metrics);
  } catch (ex) {
    res.status(500).end(ex);
  }
};
