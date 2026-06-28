/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for minimal Docker images.
  output: 'standalone',

  // Image optimization with CDN support.
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Proxy /api/* requests to the local Fastify API service during development.
  // In production, set NEXT_PUBLIC_API_URL or configure your reverse proxy.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${apiUrl}/auth/:path*`,
      },
    ];
  },

  // Expose the API base URL to the browser bundle (optional; useful for
  // client-side fetch calls that don't go through the rewrite proxy).
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL ?? 'http://localhost:3001',
  },

  // Security headers.
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // CSP headers for API routes (more permissive, no eval).
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; script-src 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
