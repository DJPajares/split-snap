import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { APP } from '@split-snap/shared';

export const metadata: Metadata = {
  title: APP.NAME,
  description:
    'Scan a receipt, share a link, and split the bill fairly with friends.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
      { url: '/logo.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    title: APP.NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} bg-background text-foreground flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
