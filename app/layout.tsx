import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emotions Journal",
  description: "A quiet place for whatever you're feeling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} relative min-h-screen overflow-x-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-sky-50 font-sans text-slate-900 antialiased`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
        >
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
