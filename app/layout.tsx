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
  title: "STAGELINK",
  description: "지하돌 특전 관리, 통합 정산 시스템",
  metadataBase: new URL("https://stageoftheground.vercel.app"),
  openGraph: {
    title: "STAGELINK",
    description: "지하돌 특전 관리, 통합 정산 시스템",
    siteName: "STAGELINK",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STAGELINK",
    description: "지하돌 특전 관리, 통합 정산 시스템",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#101114] text-zinc-100">{children}</body>
    </html>
  );
}
