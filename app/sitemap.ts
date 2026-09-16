import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://salinas-ahora.uruguayrealtors.chatgpt.site/',
      lastModified: new Date('2026-09-08'),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
