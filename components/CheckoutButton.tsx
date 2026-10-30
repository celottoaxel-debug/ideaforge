"use client";

import { useState } from "react";

export default function CheckoutButton({
  plan,
  label,
  redirecting,
  unavailable,
  className = "btn primary",
}: {
  plan: "lifetime" | "monthly";
  label: string;
  redirecting: string;
  unavailable: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function buy() {
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) { window.location.href = "/login"; return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setErr(unavailable);
    } catch {
      setErr(unavailable);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className={className} onClick={buy} disabled={loading} style={{ justifyContent: "center", width: "100%" }}>
        {loading ? redirecting : label}
      </button>
      {err && <p className="msg err">{err}</p>}
    </>
  );
}
