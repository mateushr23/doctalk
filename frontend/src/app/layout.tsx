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
  metadataBase: new URL('https://doctalk.vercel.app'),
  title: "DocTalk — Chat with your PDF documents",
  description:
    "Upload any PDF and ask questions about it. Get instant, accurate answers powered by AI. Summarize documents, extract key points, and find specific information in seconds.",
  openGraph: {
    title: "DocTalk — Chat with your PDF",
    description:
      "Upload a PDF, ask questions, get answers. Understand your documents faster with AI-powered chat.",
    type: "website",
    url: "https://doctalk.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocTalk — Chat with your PDF",
    description: "Upload a PDF, ask questions, get answers. Understand your documents faster with AI-powered chat.",
  },
  alternates: {
    canonical: "/",
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
      <body className="min-h-dvh bg-bg text-text-1 font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "DocTalk",
              description: "Upload any PDF and ask questions about it. Get instant, accurate answers powered by AI.",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
