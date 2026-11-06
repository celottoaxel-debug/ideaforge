import type { Idea } from "@/lib/types";
import { type Dossier, fallbackDossier } from "./engine";
import { A } from "./data/a";
import { B } from "./data/b";
import { C } from "./data/c";
import { D } from "./data/d";

const ALL: Record<string, Dossier> = { ...A, ...B, ...C, ...D };

// Dossier rédigé si disponible, sinon hypothèses déduites de la fiche (idées découvertes par l'IA).
export function getDossier(it: Idea): { dossier: Dossier; generic: boolean } {
  const d = ALL[it.id];
  return d ? { dossier: d, generic: false } : { dossier: fallbackDossier(it), generic: true };
}

export { renderDossier } from "./render";
