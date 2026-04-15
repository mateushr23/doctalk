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
  title: "DocTalk — Chat with your PDF documents",
  description:
    "Upload a PDF and ask questions about it. Get instant answers from your documents with AI-powered chat.",
  openGraph: {
    title: "DocTalk — Chat with your PDF",
    description:
      "Upload a PDF, ask questions, get answers. A simple tool to read and understand your documents faster.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-[100dvh] bg-[#FAFAFA] text-[#111111] font-sans">
        {children}
      </body>
    </html>
  );
}
