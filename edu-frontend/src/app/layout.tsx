"use client";

// src/app/layout.tsx
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import "./globals.css";

// Client-only render to avoid hydration mismatch (extensions inject fdprocessedid, etc.)
const MainNavbar = dynamic(() => import("@/src/components/layout/MainNavbar"), {
  ssr: false,
});

const EnhancedFooter = dynamic(() => import("@/src/components/layout/EnhancedFooter"), {
  ssr: false,
});

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Replaces `export const metadata` (not allowed in Client Component layouts) */}
        <title>LearnNova</title>
        <meta name="description" content="Smart EDU platform for kids and teens" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body className={inter.className}>
        <div className="flex min-h-screen flex-col bg-white">
          <MainNavbar />
          <main className="flex-1">{children}</main>
          <EnhancedFooter />
        </div>
      </body>
    </html>
  );
}
