import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Ubuntu } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const fontJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta-fallback",
  subsets: ["latin"],
});

const fontUbuntu = Ubuntu({
  variable: "--font-ubuntu-fallback",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono-face",
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
        className={`${fontJakarta.variable} ${fontUbuntu.variable} ${fontMono.variable} bg-background text-foreground antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
