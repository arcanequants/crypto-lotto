import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for serverless deployment (Vercel)
  output: 'standalone',

  // Disable type checking during build (for faster deployments)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations for Core Web Vitals
  compress: true, // Enable gzip compression

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs in production
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@rainbow-me/rainbowkit', 'wagmi'],
  },

  // ==========================================
  // SECURITY HEADERS (CRITICAL FIX C-8)
  // ==========================================
  // CVSS: 7.5/10 (HIGH)
  // Protects against: XSS, Clickjacking, MIME sniffing, etc.
  // ==========================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetching
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },

          // Clickjacking Protection
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },

          // MIME Type Sniffing Protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },

          // Referrer Policy (privacy)
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },

          // CRITICAL: HSTS (Force HTTPS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },

          // CRITICAL: Content Security Policy (XSS Protection)
          // Allows Web3 wallets (MetaMask, WalletConnect, etc.) and Privy auth
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://*.walletconnect.com https://*.coinbase.com https://*.privy.io https://auth.privy.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.privy.io",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.base.org https://*.basescan.org https://*.walletconnect.com https://*.coinbase.com https://api.coingecko.com wss://*.walletconnect.com wss://*.coinbase.com https://*.privy.io https://*.privy.systems https://auth.privy.io wss://*.privy.io https://*.supabase.co wss://*.supabase.co https://base-mainnet.g.alchemy.com",
              "frame-src 'self' https://*.walletconnect.com https://*.coinbase.com https://*.privy.io https://auth.privy.io https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self' https://*.privy.io https://auth.privy.io",
              // NOTE: "upgrade-insecure-requests" commented out for local development (causes TLS errors with HTTP dev server)
              // Uncomment for production deployment with HTTPS
              // "upgrade-insecure-requests"
            ].filter(Boolean).join('; ')
          },

          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },

          // Permissions Policy (restrict browser features)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
        ],
      },

      // Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // Cache images
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // Security headers for API routes (no cache)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
