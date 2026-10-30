"use client";

import { useState } from "react";
import { submitQuote } from "@/app/actions";

export default function QuoteForm() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  async function action(formData: FormData) {
    setLoading(true); setMsg("");
    const res = await submitQuote(formData);
    setLoading(false);
    if (res.ok) { setErr(false); setMsg("✓ Demande envoyée ! On revient vers toi par e-mail avec le devis."); }
    else { setErr(true); setMsg("Un problème est survenu. Réessaie."); }
  }

  return (
    <form className="panel" action={action}>
      <div>
        <label htmlFor="description">Ton projet de logiciel *</label>
        <textarea id="description" name="description" rows={4} required
          placeholder="Ex : un logiciel d'organisation pour kinés — agenda, fiches patients, rappels et facturation simple." />
      </div>
      <div>
        <label htmlFor="sector">Secteur / utilisateurs</label>
        <input id="sector" name="sector" placeholder="Ex : kinés libéraux" />
      </div>
      <div>
        <label htmlFor="budget">Budget envisagé</label>
        <select id="budget" name="budget">
          <option value="">Peu importe</option>
          <option>Moins de 500 €</option>
          <option>500 – 1 500 €</option>
          <option>1 500 – 5 000 €</option>
          <option>Plus de 5 000 €</option>
        </select>
      </div>
      <div>
        <label htmlFor="email">E-mail (pour recevoir le devis)</label>
        <input id="email" name="email" type="email" placeholder="ton@email.com" />
      </div>
      <button className="btn primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
        {loading ? "Envoi…" : "Obtenir mon devis →"}
      </button>
      {msg && <p className={"msg" + (err ? " err" : "")}>{msg}</p>}
    </form>
  );
}
