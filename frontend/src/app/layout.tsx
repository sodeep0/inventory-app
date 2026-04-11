import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";
import GlobalErrorBoundary from "@/components/global-error-boundary";
import { Toaster } from "@/components/ui/sonner";
import InstallPrompt from "@/components/install-prompt";
import ScriptRegistration from "@/components/sw-registration";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "Stock Keeper",
  description: "A simple inventory management app.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stock Keeper",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#16697A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${instrumentSerif.variable} ${geist.className}`} suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var stored = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
                  var effective = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
                  if (effective === 'dark') document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
        <GlobalErrorBoundary>
          <AuthProvider>
            <main className="min-h-screen bg-background text-foreground">
              <Navbar />
              <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                {children}
              </div>
            </main>
            <Toaster />
            <InstallPrompt />
          </AuthProvider>
        </GlobalErrorBoundary>
        <ScriptRegistration />
      </body>
    </html>
  );
}
