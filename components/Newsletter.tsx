"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/app/actions";

type D = Record<string, string>;

export default function Newsletter({ t }: { t: D }) {
  const [msg, setMsg] = useState("");

  async function action(formData: FormData) {
    const res = await subscribeNewsletter(formData);
    setMsg(res.ok ? t.news_ok : t.news_err);
  }

  return (
    <form className="panel" action={action} style={{ textAlign: "center" }}>
      <h3>{t.news_h3}</h3>
      <input name="email" type="email" required placeholder={t.login_email_ph} />
      <button className="btn primary" type="submit" style={{ justifyContent: "center" }}>{t.news_btn}</button>
      {msg && <p className="msg">{msg}</p>}
    </form>
  );
}
