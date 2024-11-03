/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links', '@xterm/addon-search'],
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@xterm/xterm']
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    });
    return config;
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV !== 'production'
  },
  // Security headers commented out for now
  /*headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
      ]
    }
  ],*/
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: 'http://localhost:3001/api/:path*'
    },
    {
      source: '/socket.io/:path*',
      destination: 'http://localhost:3001/socket.io/:path*'
    }
  ],
  // Development configurations
  productionBrowserSourceMaps: process.env.NODE_ENV !== 'production',
  poweredByHeader: false,
  reactStrictMode: true,
  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable styled-components
    styledComponents: true
  },
  // Output configuration
  output: 'standalone',
  // Configure logging
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  // Enable SWC minification
  swcMinify: true,
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Configure asset prefix for CDN
  assetPrefix: process.env.ASSET_PREFIX
}
