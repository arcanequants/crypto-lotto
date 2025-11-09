import { MetadataRoute } from 'next'

/**
 * Robots.txt Configuration
 * Tells search engines which pages they can crawl
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://cryptolotto.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', // Don't crawl API routes
          '/_next/', // Don't crawl Next.js internals
          '/admin/', // Don't crawl admin pages (if any)
        ],
      },
      {
        // Special rules for major search engines
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot'],
        allow: '/',
        crawlDelay: 0,
      },
      {
        // Allow AI crawlers (ChatGPT, Claude, etc.)
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web'],
        allow: '/',
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
