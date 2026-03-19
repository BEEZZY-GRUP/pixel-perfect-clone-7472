import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "./UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Send, MessageCircle, ChevronDown, ChevronUp, Trash2, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface VideoTheaterProps {
  video: {
    id: string;
    title: string;
    description?: string | null;
    video_url: string;
    category?: string | null;
    created_at: string;
  };
  embedUrl: string;
  onClose: () => void;
}

const VideoTheater = ({ video, embedUrl, onClose }: VideoTheaterProps) => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const { data: comments = [] } = useQuery({
    queryKey: ["video-comments", video.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("video_comments")
        .select("*")
        .eq("video_id", video.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-video-comments", video.id],
    enabled: comments.length > 0,
    queryFn: async () => {
      const userIds = [...new Set(comments.map((c: any) => c.user_id))];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, company_name, avatar_url")
        .in("user_id", userIds);
      return data ?? [];
    },
  });

  const profileMap = Object.fromEntries(
    profiles.map((p: any) => [p.user_id, p])
  );

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { error } = await supabase.from("video_comments").insert({
        video_id: video.id,
        user_id: user!.id,
        content,
        parent_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-comments", video.id] });
      queryClient.invalidateQueries({ queryKey: ["profiles-for-video-comments", video.id] });
      setComment("");
      setReplyTo(null);
      setReplyContent("");
    },
    onError: () => toast.error("Erro ao comentar."),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("video_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-comments", video.id] });
      toast.success("Comentário excluído.");
    },
  });

  const topLevel = comments.filter((c: any) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c: any) => c.parent_id === parentId);

  const toggleReplies = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!comment.trim()) return;
    addComment.mutate({ content: comment.trim() });
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    addComment.mutate({ content: replyContent.trim(), parentId });
    setExpandedReplies((prev) => new Set(prev).add(parentId));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[.55rem] font-heading tracking-wider uppercase text-gold/60 bg-gold/5 px-2 py-0.5">{video.category}</span>
          <h2 className="text-foreground text-sm font-medium truncate">{video.title}</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
          <X size={18} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video */}
        <div className="flex-1 flex items-center justify-center bg-black p-0 lg:p-4">
          <div className="w-full lg:max-w-[1100px] aspect-video">
            <iframe
              src={embedUrl + "?autoplay=1"}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Comments sidebar */}
        <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-card max-h-[50vh] lg:max-h-none">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <MessageCircle size={14} className="text-gold" />
            <span className="text-[.65rem] font-heading tracking-wider uppercase text-foreground">
              Comentários ({comments.length})
            </span>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {topLevel.length === 0 && (
              <p className="text-muted-foreground text-xs text-center py-8">Nenhum comentário ainda. Seja o primeiro!</p>
            )}
            {topLevel.map((c: any) => {
              const profile = profileMap[c.user_id];
              const childReplies = replies(c.id);
              const isExpanded = expandedReplies.has(c.id);
              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex gap-2">
                    <UserAvatar size="sm" avatarUrl={profile?.avatar_url} name={profile?.company_name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-xs font-medium truncate">{profile?.company_name || "Usuário"}</span>
                        <span className="text-muted-foreground/50 text-[.55rem]">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-xs mt-0.5 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyContent(""); }}
                          className="text-muted-foreground hover:text-gold text-[.6rem] font-heading tracking-wider uppercase transition-colors"
                        >
                          Responder
                        </button>
                        {childReplies.length > 0 && (
                          <button
                            onClick={() => toggleReplies(c.id)}
                            className="text-gold/60 hover:text-gold text-[.6rem] font-heading tracking-wider flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            {childReplies.length} {childReplies.length === 1 ? "resposta" : "respostas"}
                          </button>
                        )}
                        {(c.user_id === user?.id || isAdmin) && (
                          <button
                            onClick={() => deleteComment.mutate(c.id)}
                            className="text-destructive/40 hover:text-destructive text-[.6rem] transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply input */}
                  {replyTo === c.id && (
                    <div className="ml-9 flex gap-2">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Escreva uma resposta..."
                        className="bg-secondary border-border text-foreground text-xs min-h-[36px] h-9 resize-none flex-1"
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(c.id); } }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(c.id)}
                        disabled={!replyContent.trim() || addComment.isPending}
                        className="bg-gold text-background hover:bg-gold-light h-9 w-9 p-0 shrink-0"
                      >
                        <Send size={12} />
                      </Button>
                    </div>
                  )}

                  {/* Replies */}
                  {isExpanded && childReplies.length > 0 && (
                    <div className="ml-5 pl-4 border-l border-gold/10 space-y-3">
                      {childReplies.map((r: any) => {
                        const rProfile = profileMap[r.user_id];
                        return (
                          <div key={r.id} className="flex gap-2">
                            <UserAvatar size="sm" avatarUrl={rProfile?.avatar_url} name={rProfile?.company_name} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CornerDownRight size={10} className="text-gold/30" />
                                <span className="text-foreground text-xs font-medium truncate">{rProfile?.company_name || "Usuário"}</span>
                                <span className="text-muted-foreground/50 text-[.55rem]">
                                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-foreground/80 text-xs mt-0.5 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                              {(r.user_id === user?.id || isAdmin) && (
                                <button
                                  onClick={() => deleteComment.mutate(r.id)}
                                  className="text-destructive/40 hover:text-destructive text-[.6rem] mt-1 transition-colors"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comment input */}
          <div className="shrink-0 border-t border-border p-3 flex gap-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="bg-secondary border-border text-foreground text-xs min-h-[36px] h-9 resize-none flex-1"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!comment.trim() || addComment.isPending}
              className="bg-gold text-background hover:bg-gold-light h-9 w-9 p-0 shrink-0"
            >
              <Send size={12} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoTheater;
