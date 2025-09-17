const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Настройки для Next.js 15
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Настройки для изображений
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true,
  },

  // Настройки для API и статических файлов
  async headers() {
    // Безопасные CORS origins в зависимости от окружения
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || 'https://your-domain.com').split(',')
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];

    return [
      {
        source: '/api/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.NODE_ENV === 'production' 
              ? allowedOrigins[0] // В продакшене - первый домен из списка
              : 'http://localhost:3000' // В разработке - localhost
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Настройки для перезаписи путей (для Render)
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },

  // Оптимизация для production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Настройки для production сборки
  ...(process.env.NODE_ENV === 'production' && {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
  }),
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

module.exports = process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
