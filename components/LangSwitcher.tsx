"use client";

const LOCALES = ["fr", "en", "es"] as const;

export default function LangSwitcher({ current }: { current: string }) {
  function set(loc: string) {
    document.cookie = `locale=${loc}; path=/; max-age=31536000`;
    location.reload();
  }
  return (
    <div className="langsw" role="group" aria-label="Langue">
      {LOCALES.map((l) => (
        <button key={l} type="button" aria-pressed={l === current} onClick={() => set(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
