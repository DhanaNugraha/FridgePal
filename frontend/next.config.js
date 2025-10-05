/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure images
  images: {
    domains: ['localhost'],
  },
  // Development server configuration
  devIndicators: {
    position: 'bottom-right',
  },
  // Turbopack configuration
  turbopack: {
    // Module aliases for Turbopack
    resolveAlias: {
      '@': './src',
    }
  },
  // Webpack configuration (for production build)
  webpack: (config, { dev, isServer }) => {
    // Configure module aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    // Enable HMR for development
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Check for file changes every second
        aggregateTimeout: 200, // Delay the rebuild after changes
      };
    }

    return config;
  },
};

module.exports = nextConfig;
