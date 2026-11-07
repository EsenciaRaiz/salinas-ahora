import type { Metadata } from 'next';
import { Archivo, Fraunces } from 'next/font/google';
import './globals.css';
import './hero-ads.css';

const archivo = Archivo({ variable: '--font-sans', subsets: ['latin'] });
const fraunces = Fraunces({ variable: '--font-editorial', subsets: ['latin'] });
const siteUrl = 'https://vitrinacerca.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: {
    google: 'tIeiA1knpPluYMgEngNMk-H2CxSnB-Z3v9jZn7W_KM0',
  },
  title: 'Vitrina Cerca | Negocios, servicios y lugares de Uruguay',
  description: 'Encontrá negocios y servicios cerca de vos, lugares para visitar y planes en todo Uruguay.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_UY',
    url: siteUrl,
    siteName: 'Vitrina Cerca',
    title: 'Vitrina Cerca | Negocios, servicios y lugares de Uruguay',
    description: 'Encontrá negocios y servicios cerca de vos, lugares para visitar y planes en todo Uruguay.',
  },
  twitter: {
    card: 'summary',
    title: 'Vitrina Cerca | Negocios, servicios y lugares de Uruguay',
    description: 'Encontrá negocios y servicios cerca de vos, lugares para visitar y planes en todo Uruguay.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vitrina Cerca',
    url: siteUrl,
    inLanguage: 'es-UY',
    description: 'Guía de negocios, servicios, lugares para visitar y planes en todo Uruguay.',
    areaServed: {
      '@type': 'Country',
      name: 'Uruguay',
    },
  };

  return (
    <html lang="es-UY">
      <body className={`${archivo.variable} ${fraunces.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
