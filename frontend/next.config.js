/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Turbopack configuration
  turbopack: {
    // Configure module aliases for Turbopack
    resolveAlias: {
      '@': './src',
    },
  },
  // Fallback Webpack config for production build
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
