"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/app/actions";

export default function Newsletter() {
  const [msg, setMsg] = useState("");

  async function action(formData: FormData) {
    const res = await subscribeNewsletter(formData);
    setMsg(res.ok ? "✓ Inscrit ! La première idée arrive bientôt." : "Erreur, réessaie.");
  }

  return (
    <form className="panel" action={action} style={{ textAlign: "center" }}>
      <h3>Reçois le drop gratuit chaque semaine</h3>
      <input name="email" type="email" required placeholder="ton@email.com" />
      <button className="btn primary" type="submit" style={{ justifyContent: "center" }}>Recevoir le drop</button>
      {msg && <p className="msg">{msg}</p>}
    </form>
  );
}
