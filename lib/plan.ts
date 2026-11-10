import { createClient } from "@/lib/supabase/server";

// Renvoie le plan de l'utilisateur courant : "lifetime" | "monthly" | "bonus" (mois offert) | "free" | null (déconnecté).
export async function getPlan(): Promise<string | null> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("plan, bonus_until").eq("id", user.id).maybeSingle();
    const plan = (data?.plan as string) ?? "free";
    // Mois membre offert par le parrainage
    if (plan !== "lifetime" && plan !== "monthly" && data?.bonus_until && new Date(data.bonus_until as string) > new Date()) return "bonus";
    return plan;
  } catch {
    return null;
  }
}

export function isMember(plan: string | null) {
  return plan === "lifetime" || plan === "monthly" || plan === "bonus";
}
