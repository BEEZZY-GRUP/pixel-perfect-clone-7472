import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "🔥", "💡", "❤️", "🎯", "👏"];

interface Props {
  postId: string;
  compact?: boolean;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

const PostReactions = ({ postId, compact }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions } = useQuery({
    queryKey: ["post_reactions", postId],
    queryFn: async () => {
      const { data } = await supabase
        .from("post_reactions")
        .select("*")
        .eq("post_id", postId);
      return data ?? [];
    },
  });

  const toggleReaction = useMutation({
    mutationFn: async (emoji: string) => {
      const existing = reactions?.find(
        (r) => r.user_id === user?.id && r.emoji === emoji
      );
      if (existing) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_reactions").insert({
          post_id: postId,
          user_id: user!.id,
          emoji,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post_reactions", postId] });
    },
  });

  const grouped: ReactionGroup[] = REACTION_EMOJIS.map((emoji) => {
    const matching = reactions?.filter((r) => r.emoji === emoji) ?? [];
    return {
      emoji,
      count: matching.length,
      hasReacted: matching.some((r) => r.user_id === user?.id),
    };
  });

  const hasAnyReaction = grouped.some((g) => g.count > 0);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {grouped.map((g) =>
        g.count > 0 || !compact ? (
          <button
            key={g.emoji}
            onClick={(e) => {
              e.stopPropagation();
              toggleReaction.mutate(g.emoji);
            }}
            disabled={toggleReaction.isPending}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-xs transition-all border",
              g.hasReacted
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-border hover:border-gold/20 text-muted-foreground hover:text-foreground",
              compact && g.count === 0 && "hidden"
            )}
          >
            <span className="text-sm">{g.emoji}</span>
            {g.count > 0 && (
              <span className="text-[.65rem] font-heading font-medium">
                {g.count}
              </span>
            )}
          </button>
        ) : null
      )}
      {!compact && !hasAnyReaction && (
        <span className="text-[.6rem] text-muted-foreground/50 ml-1 font-heading tracking-wider uppercase">
          Reagir
        </span>
      )}
    </div>
  );
};

export default PostReactions;
