import type { Metadata } from "next";
import "./globals.css";

import AppHeader from "@/components/AppHeader";
import AppCartDrawer from "@/components/AppCartDrawer";
import AppFooter from "@/components/AppFooter";
import MetaPixel from "@/components/MetaPixel";

export const metadata: Metadata = {
  title: "INGRESSE",
  description:
    "Descubra eventos, escolha seus ingressos e garanta sua próxima experiência com segurança.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <MetaPixel />

        <AppHeader />

        {children}

        <AppFooter />

        <AppCartDrawer />
      </body>
    </html>
  );
}
