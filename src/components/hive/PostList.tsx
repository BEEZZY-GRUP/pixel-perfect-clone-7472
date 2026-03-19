import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Pin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PostReactions from "./PostReactions";
import UserAvatar from "./UserAvatar";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  categorySlug: string | null;
  categories: Category[];
  isAdmin?: boolean;
}

const PostList = ({ categorySlug, categories, isAdmin }: Props) => {
  const navigate = useNavigate();

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

      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, company_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
      return data.map((post) => ({ ...post, profile: profileMap.get(post.user_id) ?? null }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-border p-6 animate-pulse">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary rounded w-1/4" />
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!posts?.length) {
    return (
      <div className="border border-border p-12 text-center">
        <MessageSquare size={32} className="text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          Nenhuma publicação ainda. Seja o primeiro a publicar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post: any) => {
        const commentCount = post.comments?.[0]?.count ?? 0;
        const createdAt = new Date(post.created_at);
        const contentPreview = post.content?.length > 180
          ? post.content.slice(0, 180) + "..."
          : post.content;

        return (
          <article
            key={post.id}
            className="border border-border hover:border-gold/25 transition-all duration-200 group bg-card"
          >
            <button
              onClick={() => navigate(`/the-hive/community/post/${post.id}`)}
              className="w-full text-left p-5 pb-3"
            >
              <div className="flex items-center gap-3 mb-3">
                <UserAvatar
                  avatarUrl={post.is_anonymous ? null : post.profile?.avatar_url}
                  name={post.is_anonymous ? "A" : post.profile?.company_name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium truncate">
                      {post.is_anonymous ? "Anônimo" : post.profile?.company_name || "Membro"}
                    </span>
                    {post.pinned && (
                      <span className="inline-flex items-center gap-1 text-[.55rem] bg-gold/10 text-gold px-1.5 py-0.5 uppercase tracking-wider font-heading">
                        <Pin size={9} />
                        Fixado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-[.65rem]">
                    <span className="font-heading tracking-wider uppercase text-gold/60">
                      {post.categories?.emoji} {post.categories?.name}
                    </span>
                    <span className="text-border">·</span>
                    <time
                      dateTime={post.created_at}
                      title={format(createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    >
                      {formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR })}
                    </time>
                  </div>
                </div>
              </div>

              <h3 className="text-foreground font-medium text-[.95rem] leading-snug mb-1.5 group-hover:text-gold transition-colors">
                {post.title}
              </h3>

              <p className="text-muted-foreground text-[.8rem] leading-relaxed line-clamp-3">
                {contentPreview}
              </p>
            </button>

            <div className="px-5 pb-4 pt-1 flex items-center justify-between gap-3">
              <PostReactions postId={post.id} compact />
              <button
                onClick={() => navigate(`/the-hive/community/post/${post.id}`)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[.7rem] transition-colors shrink-0"
              >
                <MessageSquare size={14} />
                <span className="font-heading">
                  {commentCount} {commentCount === 1 ? "comentário" : "comentários"}
                </span>
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default PostList;
