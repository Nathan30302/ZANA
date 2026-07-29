import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZANA — Style at your fingertips',
  description:
    'Book salons, barbershops, and mobile stylists in Lusaka. Style at your fingertips.',
  icons: {
    icon: [{ url: '/brand/zana-logo.png', type: 'image/png' }],
    apple: [{ url: '/brand/zana-logo-180.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
