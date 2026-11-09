import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { PostEditor } from "@/components/AdminBlogActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Éditer un article — Admin", robots: { index: false, follow: false } };

export default async function EditPost({ searchParams }: { searchParams: { id?: string } }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return <main className="wrap" style={{ padding: 40 }}><p>Accès réservé.</p></main>;
  let post = {};
  if (searchParams.id) {
    const { data } = await createAdminClient().from("posts").select("id,title,slug,description,tags,content_md").eq("id", searchParams.id).maybeSingle();
    if (data) post = data;
  }
  return (
    <>
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/admin/blog">← Articles</a>
      </div></header>
      <main className="wrap" style={{ paddingBlock: 30, maxWidth: 900 }}>
        <h1 style={{ fontSize: 26, marginBottom: 14 }}>{searchParams.id ? "Modifier l’article" : "Nouvel article"}</h1>
        <PostEditor post={post} />
      </main>
    </>
  );
}
