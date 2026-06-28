import type { Metadata } from 'next';

export const SITE_NAME = 'Knowledge Base Central';
export const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';
export const MISSION_TAGLINE =
  'Transform fragmented learning materials, research notes, academic knowledge, and professional experience into a coherent, searchable, interconnected, and continuously evolving knowledge system.';

export function buildMetadata({
  title,
  description,
  path = '/',
  image,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
}): Metadata {
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image ?? `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: ogImage }],
    },
  };
}
