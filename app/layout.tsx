import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rond Point — Backoffice",
  description: "Backoffice Super Admin — supervision globale des Rond Points",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
