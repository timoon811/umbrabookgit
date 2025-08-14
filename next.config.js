/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем статическую генерацию для динамических страниц
  output: 'standalone',
  
  // Настройки для production
  experimental: {
    // Отключаем turbopack в production
    turbo: false,
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
