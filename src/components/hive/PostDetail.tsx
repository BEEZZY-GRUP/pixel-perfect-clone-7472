import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  postId: string;
  onBack: () => void;
  isAdmin?: boolean;
}

const PostDetail = ({ postId, onBack, isAdmin }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, categories!posts_category_id_fkey(name, emoji)")
        .eq("id", postId)
        .maybeSingle();
      if (!data) return null;

      // Fetch author profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, avatar_url")
        .eq("user_id", data.user_id)
        .maybeSingle();

      return { ...data, profile };
    },
  });

  const { data: comments } = useQuery({
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
      onBack();
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Comentário excluído!");
    },
    onError: () => toast.error("Erro ao excluir comentário."),
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate(comment.trim());
  };

  if (!post) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-secondary rounded w-1/3" />
        <div className="h-4 bg-secondary rounded w-3/4" />
        <div className="h-20 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-heading tracking-widest uppercase mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      <article className="border border-border p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[.65rem] font-heading tracking-wider uppercase text-gold/70">
            {post.categories?.emoji} {post.categories?.name}
          </span>
          {post.pinned && (
            <span className="text-[.6rem] bg-gold/10 text-gold px-2 py-0.5 uppercase tracking-wider font-heading">
              Fixado
            </span>
          )}
        </div>

        <h2 className="text-foreground text-lg font-medium mb-2">{post.title}</h2>

        <div className="text-muted-foreground text-[.7rem] mb-5">
          {post.is_anonymous ? "Anônimo" : post.profile?.company_name} ·{" "}
          {formatDistanceToNow(new Date(post.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </div>

        <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Admin or owner can delete */}
        {(isAdmin || post.user_id === user?.id) && (
          <div className="mt-4 pt-4 border-t border-border flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deletePost.mutate()}
              disabled={deletePost.isPending}
              className="text-destructive hover:text-destructive text-[.6rem] tracking-wider uppercase font-heading h-7"
            >
              <Trash2 size={12} className="mr-1" />
              Excluir publicação
            </Button>
          </div>
        )}
      </article>

      {/* Comments */}
      <div className="mt-6">
        <h3 className="text-xs font-heading tracking-widest uppercase text-muted-foreground mb-4">
          Comentários ({comments?.length ?? 0})
        </h3>

        <div className="space-y-3 mb-6">
          {comments?.map((c: any) => (
            <div key={c.id} className="border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="text-muted-foreground text-[.7rem] mb-2">
                  {c.profiles?.company_name} ·{" "}
                  {formatDistanceToNow(new Date(c.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
                {(isAdmin || c.user_id === user?.id) && (
                  <button
                    onClick={() => deleteComment.mutate(c.id)}
                    className="text-destructive/50 hover:text-destructive transition-colors"
                    title="Excluir comentário"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva um comentário..."
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[60px] flex-1 text-sm"
          />
          <Button
            type="submit"
            disabled={addComment.isPending || !comment.trim()}
            className="bg-gold text-background hover:bg-gold-light self-end"
            size="icon"
          >
            <Send size={14} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PostDetail;
