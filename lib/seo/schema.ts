import { BASE_URL } from './metadata';

export interface SchemaOrg {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Organization schema for homepage
 */
export const organizationSchema: SchemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DealerAdGen AI',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.svg`,
  description:
    'AI-powered marketing content generation platform for car dealerships',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    url: `${BASE_URL}/contact`,
  },
  sameAs: [
    'https://twitter.com/DealerAdGenAI',
    'https://linkedin.com/company/dealeradegenai',
  ],
};

/**
 * Software Application schema for homepage
 */
export const softwareAppSchema: SchemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DealerAdGen AI',
  description:
    'Generate professional marketing visuals for car dealerships using AI image generation',
  url: BASE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    price: '0',
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
};

/**
 * Product/Pricing schema
 */
export const pricingSchema: SchemaOrg = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'DealerAdGen AI',
  description:
    'Professional AI marketing content generation for car dealerships',
  brand: {
    '@type': 'Brand',
    name: 'DealerAdGen AI',
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter Plan',
      description: '50 assets/month, perfect for solo dealers',
      price: '29',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      url: `${BASE_URL}/pricing`,
    },
    {
      '@type': 'Offer',
      name: 'Professional Plan',
      description: '500 assets/month, for active dealerships',
      price: '99',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      url: `${BASE_URL}/pricing`,
    },
    {
      '@type': 'Offer',
      name: 'Enterprise Plan',
      description: 'Unlimited assets, for large dealers and groups',
      price: '299',
      priceCurrency: 'USD',
      billingDuration: 'P1M',
      url: `${BASE_URL}/pricing`,
    },
  ],
};

/**
 * Breadcrumb schema for nested pages
 */
export const breadcrumbSchema = (items: Array<{ name: string; url: string }>): SchemaOrg => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Article schema for resource pages
 */
export const articleSchema = (metadata: {
  title: string;
  description: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  url: string;
}): SchemaOrg => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: metadata.title,
    description: metadata.description,
    image: metadata.image || `${BASE_URL}/og-image.png`,
    author: {
      '@type': 'Organization',
      name: metadata.author || 'DealerAdGen AI',
    },
    datePublished: metadata.datePublished || new Date().toISOString(),
    dateModified: metadata.dateModified || new Date().toISOString(),
    url: metadata.url,
    publisher: {
      '@type': 'Organization',
      name: 'DealerAdGen AI',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.svg`,
      },
    },
  };
};

/**
 * LocalBusiness schema for dealer pages
 */
export const localBusinessSchema = (dealership: {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}): SchemaOrg => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: dealership.name,
    image: dealership.logo,
    description: `${dealership.name} - Dealership powered by DealerAdGen AI`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: dealership.address,
    },
    ...(dealership.phone && { telephone: dealership.phone }),
    ...(dealership.email && { email: dealership.email }),
    ...(dealership.website && { url: dealership.website }),
  };
};

/**
 * FAQPage schema
 */
export const faqSchema = (
  faqs: Array<{
    question: string;
    answer: string;
  }>
): SchemaOrg => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

/**
 * Generate multiple schemas as JSON-LD script tag
 */
export const generateJsonLd = (schemas: SchemaOrg | SchemaOrg[]) => {
  return JSON.stringify(Array.isArray(schemas) ? schemas : [schemas]);
};
