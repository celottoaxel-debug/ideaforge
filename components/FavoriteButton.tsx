"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions";

export default function FavoriteButton({
  ideaId, initial, saveLabel = "☆ Save", savedLabel = "★ Saved",
}: { ideaId: string; initial: boolean; saveLabel?: string; savedLabel?: string }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <button
      className="pill"
      aria-pressed={saved}
      disabled={pending}
      style={{ cursor: "pointer", color: saved ? "var(--amber)" : "var(--ink-3)" }}
      onClick={() =>
        start(async () => {
          const res = await toggleFavorite(ideaId);
          if (res.ok) setSaved(!!res.saved);
          else if (res.error === "auth") window.location.href = "/login";
        })
      }
    >
      {saved ? savedLabel : saveLabel}
    </button>
  );
}
