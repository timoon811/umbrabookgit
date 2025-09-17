import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  integrations: [
    Sentry.replayIntegration(),
  ],
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // Capture 100% of the transactions in development, 10% in production
  
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  
  // Ignore certain errors
  ignoreErrors: [
    // React hydration errors that are usually not critical
    'Hydration failed because the initial UI does not match what was rendered on the server',
    'There was an error while hydrating',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // Browser extension errors
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    // Browser compatibility errors
    'Script error',
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sentry error captured (dev mode):', event);
      return null;
    }
    
    // Filter out localhost errors in production
    if (event.request?.url?.includes('localhost')) {
      return null;
    }
    
    return event;
  },
  
  // Configure tags
  initialScope: {
    tags: {
      component: 'client',
    },
  },
});
