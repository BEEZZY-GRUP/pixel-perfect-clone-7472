import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import PostDetail from "./PostDetail";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  categorySlug: string | null;
  categories: Category[];
  isAdmin?: boolean;
}

const PostList = ({ categorySlug, categories, isAdmin }: Props) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const categoryId = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.id
    : null;

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("*, categories!posts_category_id_fkey(name, emoji, slug), comments(count)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) { console.error("Posts query error:", error); return []; }
      if (!data?.length) return [];

      // Fetch profiles for post authors
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, company_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
      return data.map((post) => ({ ...post, profile: profileMap.get(post.user_id) ?? null }));
    },
  });

  if (selectedPostId) {
    return (
      <PostDetail
        postId={selectedPostId}
        onBack={() => setSelectedPostId(null)}
        isAdmin={isAdmin}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border p-5 animate-pulse">
            <div className="h-4 bg-secondary rounded w-3/4 mb-3" />
            <div className="h-3 bg-secondary rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhuma publicação ainda. Seja o primeiro a publicar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post: any) => (
        <button
          key={post.id}
          onClick={() => setSelectedPostId(post.id)}
          className="w-full text-left border border-border p-5 hover:border-gold/30 transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[.65rem] font-heading tracking-wider uppercase text-gold/70">
                  {post.categories?.emoji} {post.categories?.name}
                </span>
                {post.pinned && (
                  <span className="text-[.6rem] bg-gold/10 text-gold px-2 py-0.5 uppercase tracking-wider font-heading">
                    Fixado
                  </span>
                )}
              </div>
              <h3 className="text-foreground text-sm font-medium group-hover:text-gold transition-colors truncate">
                {post.title}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground text-[.7rem]">
                <span>
                  {post.is_anonymous ? "Anônimo" : post.profile?.company_name}
                </span>
                <span>·</span>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
              <MessageSquare size={13} />
              <span>{post.comments?.[0]?.count ?? 0}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default PostList;
