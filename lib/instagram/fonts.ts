// Polices Geist du site, chargées depuis le paquet « geist » pour le rendu des slides (format TTF).
export async function geistFonts() {
  const [regular, semibold, bold, mono] = await Promise.all([
    fetch(new URL("../../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("../../node_modules/geist/dist/fonts/geist-mono/GeistMono-SemiBold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);
  return [
    { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Geist", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "GeistMono", data: mono, weight: 600 as const, style: "normal" as const },
  ];
}
