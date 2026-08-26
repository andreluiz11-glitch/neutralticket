import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import AppCartDrawer from "@/components/AppCartDrawer";

export const metadata: Metadata = {
  title: "Clube do Ingresso",
  description: "Eventos, festas e ingressos online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppHeader />
        {children}
        <AppCartDrawer />
      </body>
    </html>
  );
}