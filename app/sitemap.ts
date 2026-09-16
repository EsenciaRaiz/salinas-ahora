import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://vitrinacerca.com/',
      lastModified: new Date('2026-09-08'),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
