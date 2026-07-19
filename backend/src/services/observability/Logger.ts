import crypto from 'crypto';

export interface LogContext {
  traceId?: string;
  jobId?: string;
  workerId?: string;
  repositoryId?: string;
  workspaceId?: string;
  detectorId?: string;
  [key: string]: any;
}

export class Logger {
  private baseContext: LogContext;
  
  constructor(context: LogContext = {}) {
    this.baseContext = context;
  }

  public child(context: LogContext): Logger {
    return new Logger({ ...this.baseContext, ...context });
  }

  private write(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, meta: any = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.baseContext,
      ...meta,
    };
    
    // In production, this goes to stdout and is captured by fluentbit/datadog
    // Using stdout for all levels in JSON mode prevents mangling in log aggregators
    console.log(JSON.stringify(logEntry));
  }

  public info(message: string, meta?: any) {
    this.write('INFO', message, meta);
  }

  public warn(message: string, meta?: any) {
    this.write('WARN', message, meta);
  }

  public error(message: string, error?: unknown, meta?: any) {
    const errorDetails = error instanceof Error 
      ? { errorMessage: error.message, stack: error.stack }
      : { errorMessage: String(error) };
      
    this.write('ERROR', message, { ...meta, ...errorDetails });
  }

  public debug(message: string, meta?: any) {
    if (process.env.DEBUG === 'true') {
      this.write('DEBUG', message, meta);
    }
  }

  public static generateTraceId(): string {
    return crypto.randomUUID();
  }
}

export const globalLogger = new Logger();
