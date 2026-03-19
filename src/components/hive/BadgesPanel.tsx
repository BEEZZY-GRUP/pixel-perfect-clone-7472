import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Award, X, Lock } from "lucide-react";

interface Props {
  userId?: string;
}

const BadgesPanel = ({ userId }: Props) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

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

  const earnedMap = new Map(earnedBadges?.map((ub) => [ub.badge_id, ub]) ?? []);
  const selected = selectedBadge ? allBadges?.find((b) => b.id === selectedBadge) : null;
  const selectedEarned = selectedBadge ? earnedMap.get(selectedBadge) : null;

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

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {allBadges?.map((badge) => {
          const earned = earnedMap.has(badge.id);
          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge.id)}
              className={`border p-3 text-center transition-all hover:scale-105 ${
                earned
                  ? "border-gold/30 bg-gold/5 hover:border-gold/50"
                  : "border-border opacity-40 grayscale hover:opacity-60"
              }`}
            >
              <div className="text-2xl mb-1">{badge.emoji}</div>
              <p className="text-foreground text-[.6rem] font-medium leading-tight line-clamp-2">
                {badge.name}
              </p>
            </button>
          );
        })}
      </div>

      {/* Badge detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBadge(null)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="relative border border-border bg-card p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <div className="text-5xl mb-3">{selected.emoji}</div>
            <h3 className="text-foreground font-semibold text-base mb-1">{selected.name}</h3>
            <p className="text-muted-foreground text-xs mb-3 leading-relaxed">
              {selected.description}
            </p>
            <p className="text-gold text-xs font-heading mb-4">
              +{selected.xp_reward} XP
            </p>

            {selectedEarned ? (
              <div className="border-t border-border pt-3">
                <p className="text-[.65rem] text-muted-foreground uppercase tracking-wider font-heading mb-1">
                  Desbloqueada em
                </p>
                <p className="text-foreground text-sm font-medium">
                  {format(new Date(selectedEarned.earned_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            ) : (
              <div className="border-t border-border pt-3 flex items-center justify-center gap-2 text-muted-foreground/60">
                <Lock size={12} />
                <p className="text-[.65rem] uppercase tracking-wider font-heading">
                  Ainda não desbloqueada
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesPanel;
