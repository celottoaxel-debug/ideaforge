import { getLocale, dict } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { grantFromCheckoutSession } from "@/lib/grant";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement", robots: { index: false, follow: false } };

const PENDING = {
  fr: { title: "Paiement en cours de vérification", sub: "Nous n'avons pas encore la confirmation de Stripe. Recharge cette page dans quelques secondes. Si ça persiste, écris-nous : ton paiement n'est pas perdu.", cta: "Recharger" },
  en: { title: "Verifying your payment", sub: "We don't have Stripe's confirmation yet. Reload this page in a few seconds. If it persists, contact us: your payment is not lost.", cta: "Reload" },
  es: { title: "Verificando tu pago", sub: "Aún no tenemos la confirmación de Stripe. Recarga esta página en unos segundos. Si persiste, escríbenos: tu pago no se ha perdido.", cta: "Recargar" },
} as const;

export default async function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const locale = getLocale();
  const t = dict(locale);

  // Débloque l'accès directement ici, sans attendre le webhook :
  // on vérifie la session auprès de Stripe et qu'elle appartient bien à l'utilisateur connecté.
  let granted = false;
  const sessionId = searchParams.session_id;
  if (sessionId) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) granted = (await grantFromCheckoutSession(sessionId, user.id)) !== null;
    } catch (e) {
      console.error("[success] déblocage impossible :", e instanceof Error ? e.message : e);
    }
  }

  if (!granted) {
    const p = PENDING[locale as keyof typeof PENDING] ?? PENDING.fr;
    return (
      <main className="auth-wrap">
        <div className="auth-card">
          <div className="brand"><span className="mk">IF</span> IdeaForge</div>
          <h1>{p.title}</h1>
          <p className="sub">{p.sub}</p>
          <a className="prov primary" href={sessionId ? `/success?session_id=${encodeURIComponent(sessionId)}` : "/"}>{p.cta}</a>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <h1>{t.success_title}</h1>
        <p className="sub">{t.success_sub}</p>
        <a className="prov primary" href="/">{t.success_cta}</a>
      </div>
    </main>
  );
}
