import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { StoreHydrator } from "@/components/store-hydrator";
import { UpdatePrompt } from "@/components/update-prompt";
import "./globals.css";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BurpEars — entrená tus orejas",
  description: "Entrená el oído: reconocé y cantá intervalos, y dictá células rítmicas.",
  applicationName: "BurpEars",
  // iOS "Add to Home Screen". An opaque bar ("black") keeps the page below the status bar, so no safe-area padding is needed.
  appleWebApp: { capable: true, title: "BurpEars", statusBarStyle: "black" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Same as the manifest's theme_color: tints the browser/status bar when installed.
  themeColor: "#0b0c10",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0c10]">
        <StoreHydrator />
        {/* Service worker: dev runs without it so it doesn't fight HMR. `reloadOnOnline` is off so coming back online never reloads the page mid-exercise. */}
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"} reloadOnOnline={false}>
          {children}
          <UpdatePrompt />
        </SerwistProvider>
      </body>
    </html>
  );
}
