import type { MetadataRoute } from "next";

// Manifest PWA — Next.js sert ce fichier sur /manifest.webmanifest.
// Référencé automatiquement via la metadata du root layout.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rond Point — Backoffice",
    short_name: "RP Backoffice",
    description: "Backoffice Super Admin — supervision globale des Rond Points",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8FAFF",
    theme_color: "#39415E",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
