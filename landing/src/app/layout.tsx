import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "Swipy — Choose Restaurants Together",
  description: "Swipy — like Tinder, but for choosing restaurants with friends. Swipe restaurants, find matches with friends, and go eat together.",
  keywords: "restaurant, food, friends, tinder, swipe, match, dining, social",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans bg-white text-[#333333]`}>{children}</body>
    </html>
  );
}
