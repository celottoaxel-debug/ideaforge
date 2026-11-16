import { NextResponse } from "next/server";
import { runInstagram } from "@/lib/instagram/publish";
import { sendEmail, emailEnabled } from "@/lib/email/resend";
import { ADMIN_EMAILS } from "@/lib/admin";
import { adminInstagramEmail } from "@/lib/email/templates";
import { siteUrl } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Lancé chaque matin par /api/cron/emails : lundi, mercredi et vendredi, un carrousel est créé puis publié.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await runInstagram();
  if (r.ran && emailEnabled()) {
    const m = adminInstagramEmail(r.ok ? "published" : "draft", r.error ?? null, siteUrl());
    await Promise.all(ADMIN_EMAILS.map((to) => sendEmail({ to, ...m, tag: "admin_instagram" })));
  }
  return NextResponse.json(r);
}
