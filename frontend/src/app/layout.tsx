import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Anton, Monoton, Ubuntu, Fraunces, Poppins, Oswald } from "next/font/google";
import "./globals.css";
import AuthInitializer from "@/components/AuthInitializer";
import ToastContainer from "@/components/Toast";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import { DynamicIsland } from "@/components/DynamicIsland";
import { SubmitFAB } from "@/components/SubmitFAB";
import DesktopTopBar from "@/components/DesktopTopBar";
import DesktopTopBarMinimal from "@/components/DesktopTopBarMinimal";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { ContentShell } from "@/components/ContentShell";
import { SlideMenuRouter } from "@/components/SlideMenuRouter";
// import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { FingerprintMergeDetector } from "@/components/FingerprintMergeDialog";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const anton = Anton({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-display' });
const monoton = Monoton({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-accent' });
const ubuntu = Ubuntu({ subsets: ['latin'], display: 'swap', variable: '--font-ubuntu', weight: ['300', '400', '500', '700'] });
const fraunces = Fraunces({ subsets: ['latin'], display: 'swap', variable: '--font-serif', weight: ['400', '600', '700', '900'] });
// Reference landing fonts (ref-yotop10 loads Poppins + Oswald from Google Fonts)
const poppins = Poppins({ subsets: ['latin'], display: 'swap', variable: '--font-poppins', weight: ['300', '400', '500', '600', '700'] });
const oswald = Oswald({ subsets: ['latin'], display: 'swap', variable: '--font-oswald', weight: ['300', '400', '500', '600', '700'] });

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#05050f" },
  ],
  colorScheme: "dark light",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yotop10.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'YoTop10 — Fact Mine. Debate Ground.', template: '%s' },
  description: 'The open catalog of ranked lists, debates, and sourced facts. Submit your list. Defend your rankings. Curate the best of everything.',
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YoTop10",
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'YoTop10 — Fact Mine. Debate Ground.',
    description: 'The open catalog of ranked lists, debates, and sourced facts. Submit your list. Defend your rankings. Curate the best of everything.',
    url: '/',
    siteName: 'YoTop10',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'YoTop10 — Fact Mine. Debate Ground. Your open platform for ranked lists, debates, and sourced facts.',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@yotop10',
    creator: '@yotop10',
    title: 'YoTop10 — Fact Mine. Debate Ground.',
    description: 'The open catalog of ranked lists, debates, and sourced facts.',
    images: [
      {
        url: '/og-image.jpg',
        alt: 'YoTop10 — Fact Mine. Debate Ground.',
      },
    ],
  },
  other: {
    'msapplication-TileColor': '#05050f',
    'msapplication-TileImage': '/mstile-150x150.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${SITE_URL}/#organization`,
              name: 'YoTop10',
              url: SITE_URL,
              logo: `${SITE_URL}/icon-512.png`,
              sameAs: ['https://twitter.com/yotop10', 'https://reddit.com/r/yotop10'],
              foundingDate: '2025',
            },
            {
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              url: SITE_URL,
              name: 'YoTop10',
              description: 'The open catalog of ranked lists, debates, and sourced facts. Submit your list. Defend your rankings. Curate the best of everything.',
              publisher: { '@id': `${SITE_URL}/#organization` },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            },
          ],
        }).replace(/<\//gi, '<\\/') }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${anton.variable} ${monoton.variable} ${ubuntu.variable} ${fraunces.variable} ${poppins.variable} ${oswald.variable} min-h-screen flex flex-col bg-[var(--color-bg)] text-[#eaeaef]`} suppressHydrationWarning>
        {/* Mobile top bar — 980px custom breakpoint matches DynamicIsland/SlideMenu */}
        <Suspense fallback={<div className="h-14 bg-[var(--color-bg)] animate-pulse" />}>
          <div className="hide-desktop">
            <DesktopTopBar />
          </div>
        </Suspense>

        {/* Desktop sidebar — visible from 980px, matches .show-desktop */}
        <Suspense fallback={<div className="show-desktop fixed top-0 left-0 z-40 h-full w-64 xl:w-72 bg-[var(--color-bg)] animate-pulse" />}>
          <div className="show-desktop">
            <DesktopSidebar />
          </div>
        </Suspense>

        {/* Desktop minimal top bar — visible from 980px */}
        <Suspense fallback={<div className="show-desktop h-14 bg-[var(--color-bg)] animate-pulse" />}>
          <div className="show-desktop">
            <DesktopTopBarMinimal />
          </div>
        </Suspense>

        <Suspense fallback={<div className="fixed inset-0 z-40 bg-[var(--color-bg)]/50" />}>
          <SlideMenuRouter />
        </Suspense>
        <Suspense>
          <AuthInitializer />
        </Suspense>
        <ContentShell>{children}</ContentShell>
        <Suspense>
          <ToastContainer />
        </Suspense>
        <Suspense>
          <AnalyticsBeacon />
        </Suspense>
        {/* <Suspense>
          <PWAInstallPrompt />
        </Suspense> */}
        <Suspense fallback={<div className="h-0" />}>
          <FingerprintMergeDetector />
        </Suspense>
        <Suspense fallback={null}>
          <DynamicIsland />
        </Suspense>
        <Suspense fallback={null}>
          <SubmitFAB />
        </Suspense>
      </body>
    </html>
  );
}
