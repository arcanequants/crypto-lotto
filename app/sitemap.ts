import { MetadataRoute } from 'next'

/**
 * Dynamic Sitemap Generation for SEO
 * Helps search engines discover all pages on the site
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cryptolotto.app'

  // Define all static pages with their priorities and update frequencies
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0, // Homepage - highest priority
    },
    {
      url: `${baseUrl}/play`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9, // Main app page - very high priority
    },
    {
      url: `${baseUrl}/results`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8, // Results page - high priority
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7, // Informational page
    },
    {
      url: `${baseUrl}/prizes`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7, // Prize information
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6, // FAQ page
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5, // About page
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4, // Legal pages
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4, // Legal pages
    },
  ]

  return routes
}
