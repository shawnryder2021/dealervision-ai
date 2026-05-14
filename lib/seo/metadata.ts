import { Metadata } from 'next';

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dealervisionai.com';

export const siteMetadata = {
  title: 'DealerAdGen AI — AI-Powered Automotive Marketing Platform',
  shortTitle: 'DealerAdGen AI',
  description:
    'Generate professional AI-powered marketing visuals for car dealerships. Create stunning social media posts, print materials, and branded content in seconds. No design skills required.',
  longDescription:
    'DealerAdGen AI empowers car dealerships to instantly generate professional marketing materials using advanced AI image generation. Create vehicle spotlights, price drop alerts, sales event banners, service promotions, and more—all optimized for social media, websites, print, and email. Reduce content creation time from hours to seconds.',
  keywords: [
    'AI marketing',
    'automotive marketing',
    'car dealership software',
    'AI image generation',
    'marketing content creation',
    'social media marketing',
    'vehicle marketing',
    'dealership tools',
    'marketing automation',
    'AI-powered design',
  ],
  author: 'DealerAdGen AI',
  creator: 'Shawn Ryder Digital',
  publisher: 'DealerAdGen AI',
  locale: 'en_US',
  type: 'website',
  url: BASE_URL,
};

export const generateMetadata = (
  overrides: Partial<Metadata> = {}
): Metadata => {
  return {
    title: overrides.title || siteMetadata.title,
    description: overrides.description || siteMetadata.description,
    keywords: overrides.keywords || siteMetadata.keywords,
    authors: [{ name: siteMetadata.author }],
    creator: siteMetadata.creator,
    publisher: siteMetadata.publisher,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: siteMetadata.locale,
      url: siteMetadata.url,
      siteName: siteMetadata.shortTitle,
      title: overrides.title || siteMetadata.title,
      description: overrides.description || siteMetadata.description,
      ...overrides.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@DealerAdGenAI',
      title: overrides.title || siteMetadata.title,
      description: overrides.description || siteMetadata.description,
      ...overrides.twitter,
    },
    alternates: {
      canonical: overrides.alternates?.canonical || siteMetadata.url,
    },
    ...overrides,
  };
};

export const pageMetadata = {
  home: {
    title: 'DealerAdGen AI — AI Marketing for Car Dealerships',
    description:
      'Create professional dealership marketing visuals in seconds with AI. No design skills needed. Start free today.',
  },
  pricing: {
    title: 'Pricing Plans — DealerAdGen AI',
    description:
      'Choose the perfect plan for your dealership. Flexible pricing for solo dealers, growing teams, and enterprises.',
  },
  resources: {
    title: 'Resources & Guides — DealerAdGen AI',
    description:
      'Learn best practices for automotive marketing, AI content creation, and dealership growth strategies.',
  },
  login: {
    title: 'Sign In — DealerAdGen AI',
    description: 'Access your dealership account and continue creating marketing content.',
  },
  signup: {
    title: 'Get Started Free — DealerAdGen AI',
    description:
      'Create your dealership account and start generating professional marketing visuals in seconds.',
  },
};
