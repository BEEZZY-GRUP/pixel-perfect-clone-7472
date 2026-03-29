import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Send, Trash2, Pin, MessageSquare, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import PostReactions from "./PostReactions";
import UserAvatar from "./UserAvatar";
import CommentItem from "./CommentItem";
import RoleBadge from "./RoleBadge";

const CONFESSIONARIO_SLUG = "confessionario";

interface Props {
  postId: string;
  onBack: () => void;
  isAdmin?: boolean;
}

const PostDetail = ({ postId, onBack, isAdmin }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigateRouter = useNavigate();
  const [comment, setComment] = useState("");

  const { data: currentProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, company_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, categories!posts_category_id_fkey(name, emoji, slug)")
        .eq("id", postId)
        .maybeSingle();
      if (!data) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, avatar_url")
        .eq("user_id", data.user_id)
        .maybeSingle();

      return { ...data, profile };
    },
  });

  const { data: rawComments } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (!data?.length) return [];

      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, company_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
      return data.map((c) => ({ ...c, profile: profileMap.get(c.user_id) ?? null }));
    },
  });

  // Build threaded comment tree
  const threadedComments = useMemo(() => {
    if (!rawComments?.length) return [];
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const c of rawComments) {
      map.set(c.id, { ...c, replies: [] });
    }
    for (const c of rawComments) {
      const node = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, [rawComments]);

  const totalComments = rawComments?.length ?? 0;

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comentário adicionado!");
    },
    onError: () => toast.error("Erro ao comentar."),
  });

  const deletePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Publicação excluída!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigateRouter("/the-hive/community");
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate(comment.trim());
  };

  if (!post) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-secondary rounded w-20" />
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-full bg-secondary" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-secondary rounded w-1/3" />
            <div className="h-3 bg-secondary rounded w-1/4" />
          </div>
        </div>
        <div className="h-6 bg-secondary rounded w-3/4" />
        <div className="h-24 bg-secondary rounded" />
      </div>
    );
  }

  const createdAt = new Date(post.created_at);
  const isConfessionario = post.categories?.slug === CONFESSIONARIO_SLUG;
  const hideAuthor = isConfessionario && !isAdmin;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-heading tracking-widest uppercase mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      {/* Post article */}
      <article className="border border-border bg-card">
        <div className="p-4 md:p-6 pb-4">
          {/* Category + pin badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[.65rem] font-heading tracking-wider uppercase text-gold/70 bg-gold/5 px-2 py-1">
              {post.categories?.emoji} {post.categories?.name}
            </span>
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-[.55rem] bg-gold/10 text-gold px-2 py-1 uppercase tracking-wider font-heading">
                <Pin size={9} />
                Fixado
              </span>
            )}
          </div>

          {/* Author info */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => !hideAuthor && !post.is_anonymous && navigateRouter(`/the-hive/community/profile/${post.user_id}`)}
              className={!hideAuthor && !post.is_anonymous ? "cursor-pointer" : "cursor-default"}
            >
              <UserAvatar
                avatarUrl={hideAuthor ? null : (post.is_anonymous ? null : post.profile?.avatar_url)}
                name={hideAuthor ? "A" : (post.is_anonymous ? "A" : post.profile?.company_name)}
                size="lg"
              />
            </button>
            <div>
              <button
                onClick={() => !hideAuthor && !post.is_anonymous && navigateRouter(`/the-hive/community/profile/${post.user_id}`)}
                className={`text-foreground font-medium text-sm ${!hideAuthor && !post.is_anonymous ? "hover:text-gold transition-colors" : ""}`}
              >
                {hideAuthor || post.is_anonymous ? "Anônimo" : post.profile?.company_name || "Membro"}
              </button>
              <div className="flex items-center gap-1.5 text-muted-foreground text-[.65rem]">
                <Clock size={10} />
                <time
                  dateTime={post.created_at}
                  title={format(createdAt, "dd/MM/yyyy 'às' HH:mm")}
                >
                  {format(createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </time>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-foreground text-xl font-semibold leading-tight mb-4">
            {post.title}
          </h1>

          {/* Content */}
          <div className="text-foreground/85 text-sm leading-[1.75] whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Reactions bar */}
        <div className="px-4 md:px-6 py-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <PostReactions postId={post.id} />
          <span className="text-muted-foreground text-[.65rem] font-heading flex items-center gap-1.5">
            <MessageSquare size={13} />
            {totalComments} {totalComments === 1 ? "comentário" : "comentários"}
          </span>
        </div>

        {/* Admin/owner actions */}
        {(isAdmin || post.user_id === user?.id) && (
          <div className="px-4 md:px-6 py-3 border-t border-border">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deletePost.mutate()}
              disabled={deletePost.isPending}
              className="text-destructive/70 hover:text-destructive hover:bg-destructive/5 text-[.6rem] tracking-wider uppercase font-heading h-7 gap-1"
            >
              <Trash2 size={12} />
              Excluir publicação
            </Button>
          </div>
        )}
      </article>

      {/* Comments section */}
      <div className="mt-6">
        <h3 className="text-xs font-heading tracking-widest uppercase text-muted-foreground mb-5 flex items-center gap-2">
          <MessageSquare size={13} />
          Comentários ({totalComments})
        </h3>

        {/* Threaded comment list */}
        <div className="space-y-0 mb-6">
          {threadedComments.length === 0 && (
            <p className="text-muted-foreground/60 text-sm text-center py-8 border border-border border-dashed">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}
          {threadedComments.map((c: any) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              isAdmin={isAdmin ?? false}
              isConfessionario={isConfessionario}
              currentProfile={currentProfile ?? null}
            />
          ))}
        </div>

        {/* Comment form */}
        <form onSubmit={handleSubmitComment} className="border border-border bg-card p-4">
          <div className="flex gap-3">
            <UserAvatar
              avatarUrl={isConfessionario ? null : currentProfile?.avatar_url ?? null}
              name={isConfessionario ? "A" : currentProfile?.company_name ?? "Você"}
              size="sm"
              className="mt-1"
            />
            <div className="flex-1 space-y-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 min-h-[70px] text-sm resize-none focus:border-gold/30"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={addComment.isPending || !comment.trim()}
                  className="bg-gold text-background hover:bg-gold-light font-heading text-[.6rem] tracking-widest uppercase gap-1.5 h-8"
                >
                  <Send size={12} />
                  Comentar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostDetail;
