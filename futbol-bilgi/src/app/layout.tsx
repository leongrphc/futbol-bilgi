import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FutbolBilgi - Futbol Bilgi Yarismasi',
    template: '%s | FutbolBilgi',
  },
  applicationName: 'FutbolBilgi',
  description:
    'Futbol bilgini test et! Turkiye ve dunya futbolu hakkinda binlerce soru, milyoner modu, duello ve daha fazlasi.',
  keywords: [
    'futbol',
    'bilgi yarismasi',
    'quiz',
    'turkiye futbolu',
    'super lig',
    'futbol quiz',
    'trivia',
    'spor',
  ],
  authors: [{ name: 'FutbolBilgi' }],
  creator: 'FutbolBilgi',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FutbolBilgi',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'FutbolBilgi',
    title: 'FutbolBilgi - Futbol Bilgi Yarismasi',
    description:
      'Futbol bilgini test et! Binlerce soru, milyoner modu, duello ve daha fazlasi.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FutbolBilgi - Futbol Bilgi Yarismasi',
    description:
      'Futbol bilgini test et! Binlerce soru, milyoner modu, duello ve daha fazlasi.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1117',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-bg-primary text-text-primary antialiased">
        <AuthProvider>
          <AnalyticsProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
