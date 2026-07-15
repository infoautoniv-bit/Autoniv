interface SchemaBase {
  '@context': string;
  '@type': string | string[];
  [key: string]: unknown;
}

export function injectSchema(id: string, schema: SchemaBase) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(schema);
  return () => {
    const el = document.getElementById(id);
    if (el) el.remove();
  };
}

export const ORGANIZATION_SCHEMA: SchemaBase = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Autoniv',
  url: 'https://www.autoniv.com',
  logo: 'https://www.autoniv.com/logo.png',
  description: 'AI-powered voice agents, chatbots, and phone answering services for businesses.',
  sameAs: [
    'https://twitter.com/autoniv',
    'https://linkedin.com/company/autoniv',
    'https://facebook.com/autoniv',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@autoniv.com',
    telephone: '+91-98765-43210',
    availableLanguage: ['English', 'Hindi', 'Spanish', 'French'],
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
};

export const WEBSITE_SCHEMA: SchemaBase = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Autoniv',
  url: 'https://www.autoniv.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.autoniv.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export const SOFTWARE_APPLICATION_SCHEMA: SchemaBase = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Autoniv AI Platform',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Build AI voice agents, chatbots, and automated phone answering systems for your business.',
  url: 'https://www.autoniv.com',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free trial available',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
};

export const LOCAL_BUSINESS_SCHEMA: SchemaBase = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Autoniv',
  image: 'https://www.autoniv.com/logo.png',
  url: 'https://www.autoniv.com',
  telephone: '+91-98765-43210',
  email: 'support@autoniv.com',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '28.6139',
    longitude: '77.2090',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  priceRange: '$$',
};

export const SERVICE_SCHEMAS = {
  voiceAgent: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'AI Voice Agent',
    provider: { '@type': 'Organization', name: 'Autoniv' },
    description: 'AI-powered voice agents that answer calls, book appointments, and capture leads 24/7.',
    areaServed: 'Global',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Voice Agent Plans',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Starter Voice Agent' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Professional Voice Agent' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Enterprise Voice Agent' } },
      ],
    },
  },
  chatAgent: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'AI Chat Agent',
    provider: { '@type': 'Organization', name: 'Autoniv' },
    description: 'AI chatbots that engage website visitors, answer questions, and convert leads automatically.',
    areaServed: 'Global',
  },
  phoneAnswering: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'AI Phone Answering',
    provider: { '@type': 'Organization', name: 'Autoniv' },
    description: 'Automated phone answering service that handles calls, takes messages, and routes inquiries.',
    areaServed: 'Global',
  },
  appointmentBooking: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'AI Appointment Booking',
    provider: { '@type': 'Organization', name: 'Autoniv' },
    description: 'AI-powered appointment scheduling that books meetings, sends confirmations, and manages calendars.',
    areaServed: 'Global',
  },
};

export const BREADCRUMB_SCHEMA = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const FAQ_SCHEMA = (faqs: Array<{ q: string; a: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
});

export const ARTICLE_SCHEMA = (article: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  image: article.image,
  datePublished: article.datePublished,
  dateModified: article.dateModified || article.datePublished,
  author: {
    '@type': 'Organization',
    name: article.author || 'Autoniv',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Autoniv',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.autoniv.com/logo.png',
    },
  },
});

export const BLOG_POSTING_SCHEMA = (post: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  image: post.image,
  datePublished: post.datePublished,
  dateModified: post.dateModified || post.datePublished,
  author: {
    '@type': 'Person',
    name: post.author || 'Autoniv Team',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Autoniv',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.autoniv.com/logo.png',
    },
  },
});

export const VIDEO_OBJECT_SCHEMA = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: video.name,
  description: video.description,
  thumbnailUrl: video.thumbnailUrl,
  uploadDate: video.uploadDate,
  duration: video.duration || 'PT5M',
  contentUrl: video.contentUrl,
  embedUrl: video.embedUrl,
});

export const REVIEW_SCHEMA = (reviews: Array<{
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}>) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Autoniv AI Platform',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
    reviewCount: reviews.length.toString(),
  },
  review: reviews.map((review) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: review.author },
    reviewRating: { '@type': 'Rating', ratingValue: review.rating },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
  })),
});
