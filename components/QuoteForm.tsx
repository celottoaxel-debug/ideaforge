"use client";

import { useState } from "react";
import { submitQuote } from "@/app/actions";

type D = Record<string, string>;

export default function QuoteForm({ t }: { t: D }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  async function action(formData: FormData) {
    setLoading(true); setMsg("");
    const res = await submitQuote(formData);
    setLoading(false);
    if (res.ok) { setErr(false); setMsg(t.devis_ok); }
    else { setErr(true); setMsg(t.devis_err); }
  }

  return (
    <form className="panel" action={action}>
      <div>
        <label htmlFor="description">{t.devis_l_desc}</label>
        <textarea id="description" name="description" rows={4} required placeholder={t.devis_ph_desc} />
      </div>
      <div>
        <label htmlFor="sector">{t.devis_l_sector}</label>
        <input id="sector" name="sector" placeholder={t.devis_ph_sector} />
      </div>
      <div>
        <label htmlFor="budget">{t.devis_l_budget}</label>
        <select id="budget" name="budget">
          <option value="">{t.b_any}</option>
          <option>{t.b_lt500}</option>
          <option>{t.b_5_15}</option>
          <option>{t.b_15_50}</option>
          <option>{t.b_gt50}</option>
        </select>
      </div>
      <div>
        <label htmlFor="email">{t.devis_l_email}</label>
        <input id="email" name="email" type="email" placeholder={t.login_email_ph} />
      </div>
      <button className="btn primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
        {loading ? t.devis_sending : t.devis_btn}
      </button>
      {msg && <p className={"msg" + (err ? " err" : "")}>{msg}</p>}
    </form>
  );
}
