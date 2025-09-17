import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  
  // Server-specific configuration
  integrations: [
    // Automatically capture database queries
    Sentry.prismaIntegration(),
  ],
  
  // Ignore certain errors
  ignoreErrors: [
    // Database connection errors that might be temporary
    'P1001', // Can't reach database server
    'P1002', // Database server timeout
    // JWT errors (handled by our auth middleware)
    'JsonWebTokenError',
    'TokenExpiredError',
    // Validation errors (these are expected)
    'ValidationException',
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sentry error captured (dev mode):', event);
      return null;
    }
    
    // Add user context from our auth system
    if (event.user) {
      // Remove sensitive information
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    return event;
  },
  
  // Configure tags
  initialScope: {
    tags: {
      component: 'server',
    },
  },
});
