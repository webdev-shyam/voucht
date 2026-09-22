import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
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
        width: 1200,
        height: 630,
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
    creator: "@voucht_tech",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Suppress unhandled TypeError when extensions or wrappers attempt to reassign getter-only fetch
                  window.addEventListener('error', function(e) {
                    if (e && e.message && e.message.indexOf('Cannot set property fetch') !== -1) {
                      if (typeof e.preventDefault === 'function') e.preventDefault();
                      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                      return true;
                    }
                  }, true);

                  var _prevOnError = window.onerror;
                  window.onerror = function(msg) {
                    if (typeof msg === 'string' && msg.indexOf('Cannot set property fetch') !== -1) {
                      return true;
                    }
                    if (_prevOnError) return _prevOnError.apply(this, arguments);
                  };

                  // Proactively install a setter for fetch on window and prototype chain
                  var currentFetch = window.fetch;
                  var def = {
                    get: function() { return currentFetch; },
                    set: function(fn) { currentFetch = fn; },
                    configurable: true,
                    enumerable: true
                  };

                  try {
                    Object.defineProperty(window, 'fetch', def);
                  } catch(e1) {}

                  var curr = Object.getPrototypeOf ? Object.getPrototypeOf(window) : window.__proto__;
                  while (curr && curr !== Object.prototype) {
                    try {
                      var d = Object.getOwnPropertyDescriptor(curr, 'fetch');
                      if (d) {
                        Object.defineProperty(curr, 'fetch', def);
                      }
                    } catch(e2) {}
                    curr = Object.getPrototypeOf ? Object.getPrototypeOf(curr) : curr.__proto__;
                  }

                  if (typeof window.Window !== 'undefined' && window.Window.prototype) {
                    try {
                      Object.defineProperty(window.Window.prototype, 'fetch', def);
                    } catch(e3) {}
                  }
                } catch(err) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} bg-navy text-white min-h-screen antialiased selection:bg-electric selection:text-navy`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
