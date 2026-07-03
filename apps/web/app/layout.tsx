import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Sora, Manrope } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import "./globals.css";

// Wordmark e números grandes.
const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});

// Interface e texto corrido.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rise — Minha Evolução",
  description:
    "Rise é o videogame da vida real. Toda ação positiva gera progresso.",
  appleWebApp: {
    capable: true,
    title: "Rise",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${manrope.variable}`}>
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
