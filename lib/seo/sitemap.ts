import { BASE_URL } from './metadata';

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Public static routes for sitemap
 */
export const publicRoutes: SitemapEntry[] = [
  {
    url: '/',
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: '/pricing',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  {
    url: '/resources',
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: '/login',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: '/signup',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
];

/**
 * Generate XML sitemap content
 */
export const generateSitemapXml = (entries: SitemapEntry[]): string => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries
  .map((entry) => {
    const url = entry.url.startsWith('http') ? entry.url : `${BASE_URL}${entry.url}`;
    const lastModified = entry.lastModified
      ? new Date(entry.lastModified).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${entry.changeFrequency || 'weekly'}</changefreq>
    <priority>${entry.priority !== undefined ? entry.priority : 0.5}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return xml;
};

/**
 * Generate sitemap index for multiple sitemaps
 */
export const generateSitemapIndex = (sitemaps: Array<{ url: string; lastModified?: Date | string }>): string => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map((sitemap) => {
    const url = sitemap.url.startsWith('http') ? sitemap.url : `${BASE_URL}${sitemap.url}`;
    const lastModified = sitemap.lastModified
      ? new Date(sitemap.lastModified).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    return `  <sitemap>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`;
  })
  .join('\n')}
</sitemapindex>`;

  return xml;
};

/**
 * Escape XML special characters
 */
const escapeXml = (str: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Generate robots.txt content
 */
export const generateRobotsTxt = (): string => {
  return `# Allow all bots to crawl
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /*.json$

# Specific rules for common bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawl delay (in seconds) to respect server resources
Crawl-delay: 1

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-resources.xml

# Block bad bots
User-agent: MJ12bot
User-agent: AhrefsBot
User-agent: SemrushBot
Disallow: /`;
};

/**
 * Alternative tags for hreflang (multi-language support)
 */
export const generateHreflangTags = (
  currentPath: string,
  languages: Array<{ locale: string; path: string }>
): string[] => {
  return languages.map((lang) => {
    const url = lang.path.startsWith('http') ? lang.path : `${BASE_URL}${lang.path}`;
    return `<link rel="alternate" hreflang="${lang.locale}" href="${url}" />`;
  });
};

/**
 * Canonical URL tag
 */
export const generateCanonicalTag = (path: string): string => {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  return `<link rel="canonical" href="${url}" />`;
};
