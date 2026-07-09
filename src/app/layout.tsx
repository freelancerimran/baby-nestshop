import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Noto_Sans_Bengali,
} from "next/font/google";

import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FacebookPixel from "@/components/facebook/FacebookPixel";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const notoBangla = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bangla",
});

export const metadata: Metadata = {
  title: "Baby Nest",
  description:
    "Educational books and learning toys for growing minds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${notoBangla.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <FacebookPixel />

        <LayoutWrapper>
          <Header />
        </LayoutWrapper>

        <main className="flex-1">
          {children}
        </main>

        <LayoutWrapper>
          <Footer />
        </LayoutWrapper>

      </body>
    </html>
  );
}