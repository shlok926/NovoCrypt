import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'secret', '*.password', '*.secret'],
    censor: '[REDACTED]',
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: function (req, res) {
    const existingID = req.id ?? req.headers['x-request-id'];
    if (existingID) return existingID;
    const id = crypto.randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customProps: (req, res) => {
    return {
      requestId: req.id,
    };
  },
});
