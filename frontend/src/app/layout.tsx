import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { GeolocationProvider } from '../context/GeolocationContext';
import { AppShell } from '../components/layout/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#689f38',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'NIT Durgapur Campus Services — Food, Fruits, Laundry & Essentials',
    template: '%s | NIT Durgapur Campus Services'
  },
  description:
    'Exclusive campus-only delivery marketplace for verified NIT Durgapur students. Hot meals, fresh fruits, express room-pickup laundry with dual OTPs, and academic stationery delivered to your residence hall room.',
  keywords: [
    'NIT Durgapur',
    'NIT Durgapur campus delivery',
    'NIT Durgapur food delivery',
    'NIT Durgapur laundry service',
    'NIT Durgapur fresh fruits',
    'NIT Durgapur student essentials',
    'Hostel delivery NIT Durgapur'
  ],
  authors: [{ name: 'NIT Durgapur Student Services Cell' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'NIT Durgapur Campus Services Platform',
    description: 'Food, Fruits, Laundry & Essentials — Made for Campus Life at NIT Durgapur.',
    url: 'https://services.nitdgp.ac.in',
    siteName: 'NIT Durgapur Campus Services',
    type: 'website',
    locale: 'en_IN'
  },
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-512x512.svg'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#f8f8f8] text-[#212121]">
        <AuthProvider>
          <GeolocationProvider>
            <CartProvider>
              <AppShell>{children}</AppShell>
            </CartProvider>
          </GeolocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
