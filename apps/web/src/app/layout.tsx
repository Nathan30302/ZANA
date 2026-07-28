import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZANA — Style at your fingertips',
  description:
    'Book salons, barbershops, and mobile stylists in Lusaka. Style at your fingertips.',
  icons: {
    icon: '/brand/zana-mark.svg',
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
