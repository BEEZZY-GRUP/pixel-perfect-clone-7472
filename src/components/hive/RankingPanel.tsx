import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

const RankingPanel = () => {
  const { data: rankings, isLoading } = useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, company_name, avatar_url, xp, level")
        .order("xp", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-secondary animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  const medalEmoji = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `${i + 1}º`;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Trophy size={16} className="text-gold" />
        <h2 className="font-heading text-sm tracking-widest uppercase text-foreground">
          Ranking
        </h2>
      </div>

      <div className="space-y-2">
        {rankings?.map((profile, i) => (
          <div
            key={profile.user_id}
            className={`flex items-center gap-3 p-3 border transition-colors ${
              i < 3
                ? "border-gold/20 bg-gold/5"
                : "border-border"
            }`}
          >
            <span className="text-sm w-8 text-center shrink-0">
              {medalEmoji(i)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-medium truncate">
                {profile.company_name}
              </p>
              <p className="text-muted-foreground text-[.65rem]">
                Nível {profile.level}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-gold text-sm font-heading font-semibold">
                {profile.xp}
              </span>
              <span className="text-muted-foreground text-[.6rem] ml-1">XP</span>
            </div>
          </div>
        ))}
      </div>

      {(!rankings || rankings.length === 0) && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhum membro no ranking ainda.
        </p>
      )}
    </div>
  );
};

export default RankingPanel;
