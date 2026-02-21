import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
  title: "Serrurerie Alsacienne",
  description: "Plateforme Logistique de Serrurerie Alsacienne",
  applicationName: "Serrurerie Als",
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
      <body className={`${inter.variable} font-sans antialiased h-full overflow-x-hidden bg-background`}>
        {children}
      </body>
    </html>
  );
}
