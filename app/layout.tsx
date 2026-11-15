import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/providers/FirebaseProvider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AppVolt Play — Verified Android App Store & APK Downloader',
  description:
    'Google Play Store clone, verified APK app downloader, and real-time Cloud Firestore admin console.',
  openGraph: {
    title: 'AppVolt Play — Verified Android App Store & APK Downloader',
    description:
      'Google Play Store clone, verified APK app downloader, and real-time Cloud Firestore admin console.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AppVolt Play',
    description:
      'Google Play Store clone, verified APK app downloader, and real-time Cloud Firestore admin console.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-white text-slate-900">
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  );
}
