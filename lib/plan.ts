import { createClient } from "@/lib/supabase/server";

// Renvoie le plan de l'utilisateur courant : "lifetime" | "free" | null (déconnecté).
export async function getPlan(): Promise<"lifetime" | "free" | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle();
  return (data?.plan as "lifetime" | "free") ?? "free";
}

export function isMember(plan: string | null) {
  return plan === "lifetime";
}
