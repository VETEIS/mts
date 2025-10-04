import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { LocationProvider } from "@/components/providers/location-provider";
import { EvidenceProvider } from "@/components/providers/evidence-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MTS - Menace to Society",
  description: "Philippine Traffic Violation Reporting System",
  icons: {
    icon: "/mts-icon.webp",
    shortcut: "/mts-icon.webp",
    apple: "/mts-icon.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ToastProvider>
            <LocationProvider>
              <EvidenceProvider>
                {children}
              </EvidenceProvider>
            </LocationProvider>
          </ToastProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
