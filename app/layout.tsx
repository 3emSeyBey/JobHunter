import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "JobHunter",
  description: "AI-powered PH job-scraper for Mack + Jenefer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b">
          <div className="container flex items-center justify-between py-3">
            <Link href="/" className="font-semibold tracking-tight">
              JobHunter
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Dashboard</Link>
              <Link href="/runs" className="hover:underline">Runs</Link>
              <Link href="/sources" className="hover:underline">Sources</Link>
              <Link href="/profiles" className="hover:underline">Profiles</Link>
              <Link href="/settings" className="hover:underline">Settings</Link>
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}
