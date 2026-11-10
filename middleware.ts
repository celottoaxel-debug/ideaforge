import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const REF_COOKIE = "if_ref";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  // Lien de parrainage ?ref=CODE : mémorisé 30 jours, le compte sera rattaché à l'inscription.
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref && /^[a-zA-Z0-9]{4,16}$/.test(ref)) {
    response.cookies.set(REF_COOKIE, ref.toLowerCase(), { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax", httpOnly: true, secure: true });
  }
  return response;
}

export const config = {
  matcher: [
    // Tout sauf les assets statiques.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
