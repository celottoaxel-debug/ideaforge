"use client";

import { useEffect } from "react";

// Ferme le menu mobile après un clic sur un lien, ou en touchant ailleurs sur la page.
export default function MobileMenuCloser() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;
      document.querySelectorAll<HTMLDetailsElement>("details.nav-mob, details.nav-more").forEach((menu) => {
        if (menu.open && (!menu.contains(target) || target.closest(".nav-mob-panel a"))) menu.open = false;
      });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
