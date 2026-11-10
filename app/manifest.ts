import type { MetadataRoute } from "next";

// Manifeste : nom et icône quand le site est ajouté à l'écran d'accueil (iPhone, Android).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IdeaForge",
    short_name: "IdeaForge",
    description: "Idées de business chiffrées : budget, revenus, plan de lancement.",
    start_url: "/",
    display: "standalone",
    background_color: "#07130f",
    theme_color: "#07130f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
