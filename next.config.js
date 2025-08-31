/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  swcMinify: true,
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Cache WASM files aggressively
        source: '/_next/static/chunks/(.*).wasm',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Webpack configuration for WASM optimization
  webpack: (config, { isServer }) => {
    // Optimize WASM loading
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    }
    
    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })
    
    return config
  },
}

module.exports = nextConfig
