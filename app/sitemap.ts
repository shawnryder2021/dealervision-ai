import { MetadataRoute } from 'next';
import { publicRoutes } from '@/lib/seo/sitemap';
import { BASE_URL } from '@/lib/seo/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => {
    const fullUrl = route.url.startsWith('http') ? route.url : `${BASE_URL}${route.url}`;
    return {
      url: fullUrl,
      lastModified: route.lastModified ? new Date(route.lastModified) : new Date(),
      changeFrequency: route.changeFrequency || 'monthly',
      priority: route.priority || 0.5,
    };
  });
}
