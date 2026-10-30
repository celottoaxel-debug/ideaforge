import { createClient } from "@/lib/supabase/server";

// Renvoie le plan de l'utilisateur courant : "lifetime" | "free" | null (déconnecté).
export async function getPlan(): Promise<string | null> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
    return (data?.plan as string) ?? "free";
  } catch {
    return null;
  }
}

export function isMember(plan: string | null) {
  return plan === "lifetime" || plan === "monthly";
}
