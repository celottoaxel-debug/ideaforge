// Textes de la nouvelle page d'accueil (refonte « La Forge »), en 3 langues.
import type { Locale } from "@/lib/i18n";

export function homeCopy(locale: Locale, n: number) {
  const fr = {
    bands: [
      { a: 0, b: 0.22, side: "l" as const, fx: "rise" as const, kicker: "IdeaForge", h: "Tu veux te lancer. Tu ne sais pas quoi.", p: "C'est l'étape où presque tout le monde bloque. Pas toi." },
      { a: 0.27, b: 0.49, side: "r" as const, fx: "drift" as const, kicker: "Le catalogue", h: `Plus de ${Math.floor(n / 10) * 10} idées, déjà analysées.`, p: "Budget de départ, revenus sur 24 mois, concurrents, risques. Les chiffres avant le premier euro." },
      { a: 0.54, b: 0.76, side: "l" as const, fx: "grid" as const, kicker: "Le plan", h: "Chaque idée a son plan.", p: "Étape par étape, avec les prompts pour la construire avec l'IA, même sans savoir coder." },
      { a: 0.82, b: 1, side: "c" as const, fx: "settle" as const, kicker: "Ton prochain business", h: "Choisis. Forge. Lance.", p: "Le catalogue d'idées de business chiffrées, prêtes à lancer.", cta: true },
    ],
    staticKicker: "IdeaForge", staticH: "Choisis. Forge. Lance.",
    staticP: `${n} idées de business analysées : budget, revenus sur 24 mois, concurrents et plan de lancement avec l'IA.`,
    ctaIdeas: "Voir les idées", ctaLife: "Accès à vie",
    proof: [
      { v: String(n), s: "", l: "idées analysées et chiffrées, et de nouvelles chaque semaine" },
      { v: "24", s: "mois", l: "de projection de revenus pour chaque idée" },
      { v: "50", s: "prompts", l: "pour construire ton produit avec l'IA" },
      { v: "14", s: "jours", l: "satisfait ou remboursé, sur simple e-mail" },
    ],
    fearsEye: "Ce qui bloque", fearsH: "Les trois peurs avant de se lancer.", fearsP: "On les entend partout. Voici comment IdeaForge y répond.",
    fears: [
      { q: "Je ne sais pas quoi lancer.", a: <>Tu parcours <b>{n} idées</b> triées par budget, secteur et difficulté. Tu choisis celle qui te ressemble.</> },
      { q: "J'ai peur de construire un truc que personne n'achète.", a: <>Chaque fiche montre <b>la demande réelle</b> : marché, concurrents qui gagnent déjà de l'argent, risques à surveiller.</> },
      { q: "Je ne sais pas par où commencer.", a: <>Un <b>plan de lancement étape par étape</b>, et les prompts pour coder ton produit avec l'IA.</> },
    ],
    howEye: "Comment ça marche", howH: "De l'idée brute au plan solide.", howP: "Trois étapes, comme une coulée qui remplit un circuit.",
    how: [
      { h: "On écoute le marché", p: "Plaintes sur les forums, avis négatifs d'apps : on repère les problèmes qui reviennent." },
      { h: "On vérifie l'argent", p: "On ne garde que les modèles qui rapportent déjà : prix, marges, croissance." },
      { h: "Tu reçois la fiche", p: "Budget, revenus sur 24 mois, concurrents, risques, plan de lancement et prompt IA." },
    ],
    forgeEye: "Essaie", forgeH: "Forge ta première idée.", forgeP: "Maintiens le bouton appuyé. Une vraie idée du catalogue sort de la forge.",
    forgeL: { hold: "Maintiens pour forger", holding: "Ça chauffe…", again: "Forger une autre", open: "Voir la fiche", budget: "Budget", revenue: "Revenus", delay: "Délai" },
    finalH: "Ton idée est déjà dans la forge.", finalP: "Débloque toutes les fiches, les nouvelles idées chaque semaine et le pack de 50 prompts. Un seul paiement.",
    themesH: "Explorer les idées par thème", faqH: "Questions fréquentes",
  };
  if (locale === "en") return {
    ...fr,
    bands: [
      { ...fr.bands[0], h: "You want to start. You don't know what.", p: "It's where almost everyone gets stuck. Not you." },
      { ...fr.bands[1], kicker: "The catalog", h: `${Math.floor(n / 10) * 10}+ ideas, already analyzed.`, p: "Starting budget, 24-month revenue, competitors, risks. The numbers before your first euro." },
      { ...fr.bands[2], kicker: "The plan", h: "Every idea has a plan.", p: "Step by step, with prompts to build it with AI, even if you can't code." },
      { ...fr.bands[3], kicker: "Your next business", h: "Choose. Forge. Launch.", p: "The catalog of costed business ideas, ready to launch." },
    ],
    staticH: "Choose. Forge. Launch.",
    staticP: `${n} business ideas analyzed: budget, 24-month revenue, competitors and an AI launch plan.`,
    ctaIdeas: "See the ideas", ctaLife: "Lifetime access",
    proof: [
      { v: String(n), s: "", l: "ideas analyzed and costed, new ones every week" },
      { v: "24", s: "months", l: "of revenue projection for every idea" },
      { v: "50", s: "prompts", l: "to build your product with AI" },
      { v: "14", s: "days", l: "money-back guarantee, by simple email" },
    ],
    fearsEye: "What holds you back", fearsH: "The three fears before starting.", fearsP: "We hear them everywhere. Here's how IdeaForge answers them.",
    fears: [
      { q: "I don't know what to launch.", a: <>Browse <b>{n} ideas</b> sorted by budget, sector and difficulty. Pick the one that fits you.</> },
      { q: "I'm scared of building something nobody buys.", a: <>Every sheet shows <b>real demand</b>: market, competitors already making money, risks to watch.</> },
      { q: "I don't know where to start.", a: <>A <b>step-by-step launch plan</b>, plus prompts to code your product with AI.</> },
    ],
    howEye: "How it works", howH: "From raw idea to solid plan.", howP: "Three steps, like molten light filling a circuit.",
    how: [
      { h: "We listen to the market", p: "Forum complaints, bad app reviews: we spot the problems that keep coming back." },
      { h: "We check the money", p: "We only keep models that already earn: pricing, margins, growth." },
      { h: "You get the sheet", p: "Budget, 24-month revenue, competitors, risks, launch plan and AI prompt." },
    ],
    forgeEye: "Try it", forgeH: "Forge your first idea.", forgeP: "Press and hold the button. A real idea from the catalog comes out of the forge.",
    forgeL: { hold: "Hold to forge", holding: "Heating up…", again: "Forge another", open: "Open the sheet", budget: "Budget", revenue: "Revenue", delay: "Time" },
    finalH: "Your idea is already in the forge.", finalP: "Unlock every sheet, new ideas every week and the 50-prompt pack. One payment.",
    themesH: "Browse ideas by theme", faqH: "FAQ",
  };
  if (locale === "es") return {
    ...fr,
    bands: [
      { ...fr.bands[0], h: "Quieres emprender. No sabes qué.", p: "Es donde casi todos se bloquean. Tú no." },
      { ...fr.bands[1], kicker: "El catálogo", h: `Más de ${Math.floor(n / 10) * 10} ideas, ya analizadas.`, p: "Presupuesto inicial, ingresos a 24 meses, competidores, riesgos. Las cifras antes del primer euro." },
      { ...fr.bands[2], kicker: "El plan", h: "Cada idea tiene su plan.", p: "Paso a paso, con los prompts para construirla con IA, aunque no sepas programar." },
      { ...fr.bands[3], kicker: "Tu próximo negocio", h: "Elige. Forja. Lanza.", p: "El catálogo de ideas de negocio con cifras, listas para lanzar." },
    ],
    staticH: "Elige. Forja. Lanza.",
    staticP: `${n} ideas de negocio analizadas: presupuesto, ingresos a 24 meses, competidores y plan de lanzamiento con IA.`,
    ctaIdeas: "Ver las ideas", ctaLife: "Acceso de por vida",
    proof: [
      { v: String(n), s: "", l: "ideas analizadas con cifras, y nuevas cada semana" },
      { v: "24", s: "meses", l: "de proyección de ingresos por idea" },
      { v: "50", s: "prompts", l: "para construir tu producto con IA" },
      { v: "14", s: "días", l: "satisfecho o reembolsado, por simple e-mail" },
    ],
    fearsEye: "Lo que frena", fearsH: "Los tres miedos antes de empezar.", fearsP: "Los oímos en todas partes. Así responde IdeaForge.",
    fears: [
      { q: "No sé qué lanzar.", a: <>Recorre <b>{n} ideas</b> ordenadas por presupuesto, sector y dificultad. Elige la tuya.</> },
      { q: "Me da miedo construir algo que nadie compre.", a: <>Cada ficha muestra <b>la demanda real</b>: mercado, competidores que ya ganan dinero, riesgos.</> },
      { q: "No sé por dónde empezar.", a: <>Un <b>plan de lanzamiento paso a paso</b> y los prompts para programar tu producto con IA.</> },
    ],
    howEye: "Cómo funciona", howH: "De la idea en bruto a un plan sólido.", howP: "Tres pasos, como metal fundido que llena un circuito.",
    how: [
      { h: "Escuchamos el mercado", p: "Quejas en foros, malas reseñas de apps: detectamos los problemas que se repiten." },
      { h: "Comprobamos el dinero", p: "Solo guardamos modelos que ya ganan: precios, márgenes, crecimiento." },
      { h: "Recibes la ficha", p: "Presupuesto, ingresos a 24 meses, competidores, riesgos, plan y prompt IA." },
    ],
    forgeEye: "Pruébalo", forgeH: "Forja tu primera idea.", forgeP: "Mantén pulsado el botón. Una idea real del catálogo sale de la forja.",
    forgeL: { hold: "Mantén para forjar", holding: "Calentando…", again: "Forjar otra", open: "Ver la ficha", budget: "Presupuesto", revenue: "Ingresos", delay: "Plazo" },
    finalH: "Tu idea ya está en la forja.", finalP: "Desbloquea todas las fichas, ideas nuevas cada semana y el pack de 50 prompts. Un solo pago.",
    themesH: "Explorar ideas por tema", faqH: "Preguntas frecuentes",
  };
  return fr;
}
