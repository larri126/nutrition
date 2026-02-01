import type { Metadata, Viewport } from "next"; // <--- Importar Viewport
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/ui/providers/QueryProvider";

const fontHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });

// 1. CONFIGURACIÓN VIEWPORT (Importante para que no haga zoom raro en inputs móviles)
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Se siente más nativo (no puedes hacer pinch-zoom)
};

export const metadata: Metadata = {
  title: "PowerFit SaaS",
  description: "Tu entrenador personal inteligente",
  manifest: "@/public/manifest.json", // <--- ENLAZAR MANIFIESTO
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PowerFit",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={cn("min-h-screen bg-black text-foreground antialiased", fontHeading.variable)}>
        <QueryProvider>
           {children}
           <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}