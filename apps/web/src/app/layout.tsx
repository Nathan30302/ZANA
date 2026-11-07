import type { Metadata } from "next";
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
  icons: {
    icon: "/brand/zana-logo.png",
    apple: "/brand/zana-logo-180.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>{children}</body>
    </html>
  );
}
