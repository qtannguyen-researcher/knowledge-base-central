import type { Metadata } from 'next';
import './globals.css';

import { SITE_NAME } from '@/lib/metadata';

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'A centralized platform to capture, organize, and connect knowledge from academic study, research, and professional experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
