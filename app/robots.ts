import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/dashboard/', '/admin/', '/*.json$'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
      },
      {
        userAgent: ['MJ12bot', 'AhrefsBot', 'SemrushBot'],
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
