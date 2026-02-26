import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PTC QuackTrack - Professional University Schedule Management",
  description: "Modern university schedule management system with admin and professor roles. Built with Next.js, TypeScript, and Firebase Firestore.",
  keywords: ["PTC QuackTrack", "University", "Schedule", "Next.js", "TypeScript", "Firebase", "shadcn/ui"],
  authors: [{ name: "PTC QuackTrack Team" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "PTC QuackTrack",
    description: "Professional university schedule management system",
    url: "https://chat.z.ai",
    siteName: "PTC QuackTrack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PTC QuackTrack",
    description: "Professional university schedule management system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
