import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Heart, Reply, Send } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentData {
  id: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profile: { user_id: string; company_name: string; avatar_url: string | null } | null;
  replies?: CommentData[];
}

interface Props {
  comment: CommentData;
  postId: string;
  isAdmin: boolean;
  isConfessionario: boolean;
  currentProfile: { avatar_url: string | null; company_name: string } | null;
  depth?: number;
}

const CommentItem = ({ comment, postId, isAdmin, isConfessionario, currentProfile, depth = 0 }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigateRouter = useNavigate();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const hideAuthor = isConfessionario; // Always anonymous in Confessionário for comments

  // Likes query
  const { data: likes } = useQuery({
    queryKey: ["comment_likes", comment.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("comment_likes")
        .select("id, user_id")
        .eq("comment_id", comment.id);
      return data ?? [];
    },
  });

  const likedByMe = likes?.some((l) => l.user_id === user?.id) ?? false;
  const likeCount = likes?.length ?? 0;

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (likedByMe) {
        const myLike = likes?.find((l) => l.user_id === user?.id);
        if (myLike) {
          await supabase.from("comment_likes").delete().eq("id", myLike.id);
        }
      } else {
        await supabase.from("comment_likes").insert({
          comment_id: comment.id,
          user_id: user!.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comment_likes", comment.id] });
    },
  });

  const addReply = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user!.id,
        content,
        parent_id: comment.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyText("");
      setReplyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Resposta adicionada!");
    },
    onError: () => toast.error("Erro ao responder."),
  });

  const deleteComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").delete().eq("id", comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Comentário excluído!");
    },
    onError: () => toast.error("Erro ao excluir comentário."),
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addReply.mutate(replyText.trim());
  };

  const commentDate = new Date(comment.created_at);
  const maxDepth = 2; // limit nesting

  return (
    <div className={depth > 0 ? "relative" : ""}>
      {/* Thread connector line for nested replies */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-gold/25 via-gold/10 to-transparent" />
      )}

      <div
        className={`flex gap-3 transition-colors ${
          depth > 0
            ? "ml-5 md:ml-8 pl-4 py-3 pr-4 rounded-md bg-secondary/20 hover:bg-secondary/40 mb-2 border border-border/50"
            : "p-4 border border-border border-t-0 first:border-t bg-card hover:bg-secondary/30"
        }`}
      >
        {/* Reply curve indicator */}
        {depth > 0 && (
          <div className="absolute left-0 top-5 w-4 h-px bg-gold/15" />
        )}

        <UserAvatar
          avatarUrl={hideAuthor ? null : comment.profile?.avatar_url ?? null}
          name={hideAuthor ? "A" : comment.profile?.company_name ?? "M"}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {depth > 0 && (
                <span className="text-gold/40 text-[.6rem] font-heading tracking-wider uppercase shrink-0">↳</span>
              )}
              <button
                onClick={() => !hideAuthor && navigateRouter(`/the-hive/community/profile/${comment.user_id}`)}
                className={`text-foreground text-[.8rem] font-medium truncate ${!hideAuthor ? "hover:text-gold transition-colors" : ""}`}
              >
                {hideAuthor ? "Anônimo" : (comment.profile?.company_name || "Membro")}
              </button>
              <time
                className="text-muted-foreground text-[.6rem] shrink-0"
                dateTime={comment.created_at}
                title={format(commentDate, "dd/MM/yyyy 'às' HH:mm")}
              >
                {formatDistanceToNow(commentDate, { addSuffix: true, locale: ptBR })}
              </time>
            </div>
            {(isAdmin || comment.user_id === user?.id) && (
              <button
                onClick={() => deleteComment.mutate()}
                className="text-destructive/40 hover:text-destructive transition-colors shrink-0 p-1"
                title="Excluir comentário"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <p className="text-foreground/85 text-[.82rem] leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions: like + reply */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => toggleLike.mutate()}
              disabled={toggleLike.isPending}
              className={`flex items-center gap-1 text-[.7rem] transition-colors ${
                likedByMe ? "text-red-400" : "text-muted-foreground hover:text-red-400"
              }`}
            >
              <Heart size={12} fill={likedByMe ? "currentColor" : "none"} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {depth < maxDepth && (
              <button
                onClick={() => setReplyOpen(!replyOpen)}
                className="flex items-center gap-1 text-[.7rem] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply size={12} />
                Responder
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyOpen && (
            <form onSubmit={handleSubmitReply} className="mt-3 flex gap-2 items-start">
              <UserAvatar
                avatarUrl={hideAuthor ? null : currentProfile?.avatar_url ?? null}
                name={hideAuthor ? "A" : currentProfile?.company_name ?? "V"}
                size="sm"
              />
              <div className="flex-1 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva uma resposta..."
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 min-h-[50px] text-xs resize-none focus:border-gold/30"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyOpen(false)}
                    className="text-muted-foreground text-[.6rem] h-7"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={addReply.isPending || !replyText.trim()}
                    className="bg-gold text-background hover:bg-gold-light font-heading text-[.55rem] tracking-widest uppercase gap-1 h-7"
                  >
                    <Send size={10} />
                    Responder
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={depth === 0 ? "relative" : ""}>
          {comment.replies.map((reply: CommentData) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              isAdmin={isAdmin}
              isConfessionario={isConfessionario}
              currentProfile={currentProfile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
