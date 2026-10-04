import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AuthErrorBridge } from "@/components/shared/AuthErrorBridge";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voucht — The Trust Layer for Freelancers",
  description:
    "Build a verified Trust Score that proves your reliability. Get vouched. Get hired.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://voucht.tech"),
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Voucht — The Trust Layer for Freelancers",
    description:
      "Build a verified Trust Score that proves your reliability. Get vouched. Get hired.",
    url: "https://voucht.tech",
    siteName: "Voucht",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1792,
        height: 1024,
        alt: "Voucht — The Trust Layer for Freelancers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voucht — The Trust Layer for Freelancers",
    description:
      "Build a verified Trust Score that proves your reliability. Get vouched. Get hired.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-navy text-white min-h-screen antialiased selection:bg-electric selection:text-navy`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthErrorBridge />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
