import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWARegister } from "@/components/pwa-register";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    icon: [
      { url: "/logo-diamond.png", sizes: "32x32",  type: "image/png" },
      { url: "/logo-diamond.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-diamond.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo-diamond.png",
    apple: [{ url: "/logo-diamond.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Exim Dashboard",
    description: "Dashboard de gestión de clientes - Exim",
    images: [{ url: "/logo-diamond.png", width: 512, height: 512, alt: "Exim" }],
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary",
    title: "Exim Dashboard",
    description: "Dashboard de gestión de clientes - Exim",
    images: ["/logo-diamond.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <NavigationProgress />
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}
