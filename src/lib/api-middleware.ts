import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface ApiMiddlewareOptions {
  enableRequestLogging?: boolean;
  enableResponseLogging?: boolean;
  enablePerformanceLogging?: boolean;
  logLevel?: 'debug' | 'info';
}

/**
 * API middleware for logging and monitoring
 */
export function withApiLogging(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: ApiMiddlewareOptions = {}
) {
  const {
    enableRequestLogging = true,
    enableResponseLogging = true,
    enablePerformanceLogging = true,
    logLevel = 'info'
  } = options;

  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const pathname = new URL(url).pathname;
    
    // Generate request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Extract request context
    const requestContext = {
      requestId,
      method,
      url: pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          request.headers.get('cf-connecting-ip') || undefined,
      referer: request.headers.get('referer') || undefined,
    };

    // Log incoming request
    if (enableRequestLogging) {
      if (logLevel === 'debug') {
        logger.debug(`API Request: ${method} ${pathname}`, requestContext);
      } else {
        logger.apiRequest(method, pathname, requestContext);
      }
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the handler
      response = await handler(request, ...args);
      
    } catch (handlerError) {
      error = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
      
      // Log the error
      logger.error(`API Handler Error: ${method} ${pathname}`, error, requestContext);
      
      // Return error response
      response = NextResponse.json(
        { 
          message: "Внутренняя ошибка сервера",
          requestId: requestId
        },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const status = response.status;

    // Add request ID to response headers
    response.headers.set('X-Request-ID', requestId);
    
    // Add performance headers
    if (enablePerformanceLogging) {
      response.headers.set('X-Response-Time', `${duration}ms`);
    }

    // Log response
    if (enableResponseLogging) {
      if (logLevel === 'debug') {
        logger.debug(`API Response: ${method} ${pathname} - ${status} (${duration}ms)`, {
          ...requestContext,
          status,
          duration,
        });
      } else {
        logger.apiResponse(method, pathname, status, duration, requestContext);
      }
    }

    // Log performance metrics
    if (enablePerformanceLogging) {
      logger.performance(`api.${method.toLowerCase()}.${pathname.replace(/\//g, '_')}`, duration, 'ms', {
        method,
        pathname,
        status,
      });
    }

    return response;
  };
}

/**
 * Error handling middleware
 */
export function withErrorHandling(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      const context = {
        method: request.method,
        url: new URL(request.url).pathname,
        userAgent: request.headers.get('user-agent') || undefined,
      };

      logger.error("Unhandled API error", error, context);

      return NextResponse.json(
        { 
          message: "Внутренняя ошибка сервера",
          ...(process.env.NODE_ENV !== 'production' && { 
            error: error instanceof Error ? error.message : String(error) 
          })
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Rate limiting helper (basic implementation)
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }
    
    // Check current limit
    const current = requests.get(ip) || { count: 0, resetTime: now + options.windowMs };
    
    if (current.count >= options.maxRequests && current.resetTime > now) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`, {
        ip,
        count: current.count,
        maxRequests: options.maxRequests,
        windowMs: options.windowMs,
      });
      
      return NextResponse.json(
        { message: "Слишком много запросов. Попробуйте позже." },
        { status: 429 }
      );
    }
    
    // Update counter
    requests.set(ip, {
      count: current.count + 1,
      resetTime: current.resetTime
    });
    
    return handler(request, ...args);
  };
}

/**
 * Compose multiple middlewares
 */
export function composeMiddleware(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
