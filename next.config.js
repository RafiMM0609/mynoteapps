/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },

  // Environment variable validation
  env: {
    CUSTOM_BUILD_ID: process.env.NODE_ENV,
  },

  // Disable powered-by header
  poweredByHeader: false,
  // Compress responses
  compress: true,

  // Remove experimental features that might cause build issues
  // experimental: {
  //   optimizeCss: true,
  // },
}

module.exports = nextConfig
