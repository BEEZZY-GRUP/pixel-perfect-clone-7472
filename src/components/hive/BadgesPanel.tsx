import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Award } from "lucide-react";

interface Props {
  userId?: string; // If not provided, show current user's badges
}

const BadgesPanel = ({ userId }: Props) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data: allBadges } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data } = await supabase.from("badges").select("*").order("xp_reward");
      return data ?? [];
    },
  });

  const { data: earnedBadges } = useQuery({
    queryKey: ["user_badges", targetUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", targetUserId!);
      return data ?? [];
    },
    enabled: !!targetUserId,
  });

  const earnedIds = new Set(earnedBadges?.map((ub) => ub.badge_id));

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Award size={16} className="text-gold" />
        <h2 className="font-heading text-sm tracking-widest uppercase text-foreground">
          Insígnias
        </h2>
        <span className="text-muted-foreground text-[.65rem]">
          {earnedBadges?.length ?? 0}/{allBadges?.length ?? 0}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {allBadges?.map((badge) => {
          const earned = earnedIds.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`border p-3 text-center transition-all ${
                earned
                  ? "border-gold/30 bg-gold/5"
                  : "border-border opacity-40 grayscale"
              }`}
            >
              <div className="text-2xl mb-1">{badge.emoji}</div>
              <p className="text-foreground text-xs font-medium">{badge.name}</p>
              <p className="text-muted-foreground text-[.6rem] mt-0.5">
                {badge.description}
              </p>
              <p className="text-gold text-[.6rem] font-heading mt-1">
                +{badge.xp_reward} XP
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesPanel;
