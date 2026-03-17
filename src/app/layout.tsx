import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Exim Dashboard",
  description: "Dashboard de gestión de clientes - Exim",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Exim",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/logo-diamond.png",
    apple: "/logo-diamond.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#575ECF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${bebasNeue.variable} antialiased`}>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
        <PWARegister />
      </body>
    </html>
  );
}
