// Fichiers de la vidéo d'accueil (tête de particules), hébergés sur le CDN Higgsfield
// (CORS ouvert, cache permanent). Taille réelle de la vidéo dans `bytes` pour l'anneau de chargement.
const CDN = "https://d2ol7oe51mr4n9.cloudfront.net/user_38UhoRjmEu868zm868frHTGG3hX";
export const HERO = {
  video: `${CDN}/36185fa3-caa6-4c85-be52-cd8ccbce4445.mp4`,
  poster: `${CDN}/ff6a2307-ed3f-4b5f-a3b6-578185987c5d.jpg`,
  ending: `${CDN}/f25914b8-b6ee-41cd-9ba6-0f9c84032290.jpg`,
  steps: [
    `${CDN}/e10d8ccd-2561-44bc-a9ce-cce0d026010c.jpg`,
    `${CDN}/ef2b7988-bcbc-492a-a420-3e1308c38bb2.jpg`,
    `${CDN}/74942710-e953-40de-9612-005a5c6dcd43.jpg`,
  ],
  bytes: 3_853_151,
};
