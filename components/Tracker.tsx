"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mesure d'audience maison, sans cookie : envoie la page vue au serveur à chaque changement de page.
export default function Tracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    try {
      const q = new URLSearchParams(window.location.search);
      const body = JSON.stringify({
        p: pathname,
        r: document.referrer || "",
        u: q.get("utm_source") || q.get("ref") || "",
      });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
    } catch {}
  }, [pathname]);
  return null;
}
