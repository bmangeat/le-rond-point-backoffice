import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rond Point — Backoffice",
  description: "Backoffice Super Admin — supervision globale des Rond Points",
  applicationName: "RP Backoffice",
  appleWebApp: { capable: true, title: "RP Backoffice", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: "#39415E",
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
