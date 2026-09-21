import type { Metadata } from "next";
import "./globals.css";
import { DisclaimerBar } from "@/features/safety/DisclaimerBar";

export const metadata: Metadata = {
  title: {
    default: "LexLens — Know what you're signing",
    template: "%s | LexLens",
  },
  description:
    "LexLens explains contracts, leases and legal documents in plain language, flags clauses that put you at risk, and helps you prepare to talk to a lawyer.",
  keywords: ["legal", "contract", "document", "analysis", "AI", "plain language"],
  authors: [{ name: "LexLens" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "LexLens",
    title: "LexLens — Know what you're signing",
    description:
      "AI-powered legal document analysis. Understand contracts, spot risks, and prepare for your lawyer.",
  },
  icons: {
    icon: [{ url: "/svg/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col bg-baize-900 text-[--text-on-dark] antialiased">
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-baize-800 focus:text-brass-300 focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>

        <main id="main-content" className="flex-1 flex flex-col" tabIndex={-1}>
          {children}
        </main>

        {/* Disclaimer bar — persistent on all pages (not dismissable) */}
        <DisclaimerBar />
      </body>
    </html>
  );
}
