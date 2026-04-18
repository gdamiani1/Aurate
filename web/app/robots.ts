import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /auth/confirm is a transactional landing (parses auth tokens from the
        // URL hash and deep-links to the app). No value in Google indexing it.
        disallow: '/auth/confirm',
      },
    ],
    sitemap: 'https://www.mogster.app/sitemap.xml',
    host: 'https://www.mogster.app',
  };
}
