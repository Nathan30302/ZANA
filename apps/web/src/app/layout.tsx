import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Zana — Beauty on your fingertips",
  description: "Book salons, barbers, and beauty pros in Lusaka — at home or at the shop.",
  applicationName: "Zana",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "Zana",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/brand/zana-logo.png",
    apple: "/brand/zana-logo-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffaf8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>{children}</body>
    </html>
  );
}
