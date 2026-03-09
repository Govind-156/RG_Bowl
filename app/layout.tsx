import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import ClosedNowBanner from "@/components/ClosedNowBanner";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RG Bowl – BTM",
  description:
    "Fresh comfort bowls cooked when you order. Built for late-night cravings in BTM, Bangalore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} flex min-h-screen bg-[var(--background)] text-zinc-50 antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen w-full flex-col">
            <Navbar />
            <ClosedNowBanner />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
