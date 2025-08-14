/** @type {import('next').NextConfig} */
const nextConfig = {
  // Настройки для production
  experimental: {
    // Отключаем turbopack в production
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Отключаем линтинг в production
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Отключаем проверку типов в production
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Настройки для изображений
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // Настройки для API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // Настройки для перезаписи путей
  async rewrites() {
    return [
      {
        source: '/docs/:path*',
        destination: '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
