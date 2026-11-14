import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { AppShell } from '@/components/layout/app-shell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
