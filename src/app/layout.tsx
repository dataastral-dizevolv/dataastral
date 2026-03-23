import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Libre_Baskerville } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const fontBody = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const fontDisplay = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const fontMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Data Astral | Previsoes com Efemerides Reais",
  description:
    "Faca sua pergunta, escolha um tema e receba previsoes astrologicas baseadas em efemerides reais.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable} bg-background text-foreground antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
