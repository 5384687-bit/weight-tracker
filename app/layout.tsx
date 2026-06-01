import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./lib/auth-context";
import AuthGuard from "./components/AuthGuard";
import SyncStatus from "./components/SyncStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export const metadata: Metadata = {
  title: "מעקב משקל - הדרך לגרסה הטובה שלך",
  description: "אפליקציה למעקב משקל, תזונה וכושר",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "מעקב משקל",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex">
        <AuthProvider>
          <AuthGuard>
            <Navigation />
            <SyncStatus />
            <main className="flex-1 md:mr-64 p-4 md:p-8">{children}</main>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
