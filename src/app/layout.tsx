import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { BUSINESS_CONFIG } from "@/config/business";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});


export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: BUSINESS_CONFIG.name,
  description: `Plateforme Logistique de ${BUSINESS_CONFIG.name}`,
  applicationName: BUSINESS_CONFIG.name,
  appleWebApp: {
    capable: true,
    title: "SA OS",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head />
      <body className={`${outfit.variable} font-sans antialiased h-full overflow-x-hidden bg-background`}>

        {children}
      </body>
    </html>
  );
}
