// Fichiers de la vidéo d'accueil « La Forge » (hébergés sur le stockage Supabase public).
const BASE = "https://odkzhathddzbxojezcnx.supabase.co/storage/v1/object/public/site/hero";
export const HERO = {
  video: `${BASE}/forge-scrub.mp4`,
  poster: `${BASE}/forge-poster.jpg`,
  ending: `${BASE}/forge-ending.jpg`,
  bytes: 6_000_000, // taille réelle mise à jour après l'encodage
};
