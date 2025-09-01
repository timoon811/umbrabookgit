import * as Sentry from "@sentry/nextjs";

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error | unknown;
  timestamp: string;
  source: 'client' | 'server' | 'api';
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private enableConsole = this.isDevelopment || process.env.ENABLE_CONSOLE_LOGS === 'true';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown
  ): LogEntry {
    return {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString(),
      source: typeof window !== 'undefined' ? 'client' : 'server',
    };
  }

  debug(message: string, context?: LogContext) {
    const logEntry = this.createLogEntry(LogLevel.DEBUG, message, context);
    
    if (this.enableConsole) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }

    // Only log debug messages in development
    if (this.isDevelopment && context) {
      Sentry.addBreadcrumb({
        message,
        level: 'debug',
        data: context,
      });
    }
  }

  info(message: string, context?: LogContext) {
    const logEntry = this.createLogEntry(LogLevel.INFO, message, context);
    
    if (this.enableConsole) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
    });
  }

  warn(message: string, context?: LogContext) {
    const logEntry = this.createLogEntry(LogLevel.WARN, message, context);
    
    if (this.enableConsole) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }

    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
    });

    // Send warnings to Sentry in production
    if (!this.isDevelopment) {
      Sentry.captureMessage(message, 'warning');
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const logEntry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    
    if (this.enableConsole) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
      if (error) {
        console.error(error);
      }
    }

    // Always capture errors
    if (error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
        tags: {
          component: logEntry.source,
        },
      });
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }

  // API request logging
  apiRequest(method: string, url: string, context?: LogContext) {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      type: 'api_request',
      method,
      url,
    });
  }

  apiResponse(method: string, url: string, status: number, duration: number, context?: LogContext) {
    const level = status >= 400 ? LogLevel.ERROR : status >= 300 ? LogLevel.WARN : LogLevel.INFO;
    const message = `API Response: ${method} ${url} - ${status} (${duration}ms)`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, {
        ...context,
        type: 'api_response',
        method,
        url,
        status,
        duration,
      });
    } else if (level === LogLevel.WARN) {
      this.warn(message, {
        ...context,
        type: 'api_response',
        method,
        url,
        status,
        duration,
      });
    } else {
      this.info(message, {
        ...context,
        type: 'api_response',
        method,
        url,
        status,
        duration,
      });
    }
  }

  // Database operation logging
  dbQuery(operation: string, table: string, duration?: number, context?: LogContext) {
    this.debug(`DB Query: ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`, {
      ...context,
      type: 'db_query',
      operation,
      table,
      duration,
    });
  }

  dbError(operation: string, table: string, error: Error, context?: LogContext) {
    this.error(`DB Error: ${operation} on ${table}`, error, {
      ...context,
      type: 'db_error',
      operation,
      table,
    });
  }

  // Authentication logging
  authAttempt(email: string, success: boolean, context?: LogContext) {
    const message = `Auth attempt for ${email}: ${success ? 'SUCCESS' : 'FAILED'}`;
    const logContext = {
      ...context,
      type: 'auth_attempt',
      email: email.replace(/(.{2}).*@/, '$1***@'), // Mask email for privacy
      success,
    };

    if (success) {
      this.info(message, logContext);
    } else {
      this.warn(message, logContext);
    }
  }

  // User action logging
  userAction(action: string, userId: string, context?: LogContext) {
    this.info(`User action: ${action}`, {
      ...context,
      type: 'user_action',
      action,
      userId,
    });
  }

  // Security logging
  securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext) {
    const message = `Security event [${severity.toUpperCase()}]: ${event}`;
    
    if (severity === 'high') {
      this.error(message, undefined, { ...context, type: 'security_event', severity });
    } else if (severity === 'medium') {
      this.warn(message, { ...context, type: 'security_event', severity });
    } else {
      this.info(message, { ...context, type: 'security_event', severity });
    }
  }

  // Performance logging
  performance(metric: string, value: number, unit: string = 'ms', context?: LogContext) {
    this.info(`Performance: ${metric} = ${value}${unit}`, {
      ...context,
      type: 'performance',
      metric,
      value,
      unit,
    });

    // Track performance metrics in Sentry
    Sentry.metrics.gauge(metric, value, {
      unit,
      tags: context,
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports
export const log = logger;
export default logger;
