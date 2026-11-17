import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgencyCore — Agency Operations & Project Lifecycle Hub',
  description:
    'Internal agency operations hub for client intake, encrypted credentials, task execution, and immutable project archives.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-950 font-sans">
        <AppProviders>
          <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
