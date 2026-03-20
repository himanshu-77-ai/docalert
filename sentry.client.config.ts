import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture 100% of errors in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Show error dialog to users in production
  integrations: [
    Sentry.feedbackIntegration({
      colorScheme: 'light',
      buttonLabel: 'Report a bug',
      submitButtonLabel: 'Send report',
      messagePlaceholder: 'What happened? What were you doing when the error occurred?',
    }),
  ],

  beforeSend(event) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') return null
    return event
  },
})
