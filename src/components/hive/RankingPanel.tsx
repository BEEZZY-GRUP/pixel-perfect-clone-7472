import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";

const ITEMS_PER_PAGE = 10;

const RankingPanel = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: rankings, isLoading } = useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, company_name, avatar_url, xp, level")
        .order("xp", { ascending: false });
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

  const totalPages = Math.max(1, Math.ceil((rankings?.length ?? 0) / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = rankings?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) ?? [];

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
        <span className="text-muted-foreground text-xs font-heading">{rankings?.length ?? 0} membros</span>
      </div>

      <div className="space-y-2">
        {paginated.map((profile, i) => {
          const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i;
          return (
            <div
              key={profile.user_id}
              onClick={() => navigate(`/the-hive/community/profile/${profile.user_id}`)}
              className={`flex items-center gap-3 p-3 border transition-colors cursor-pointer hover:bg-secondary/50 ${
                globalIndex < 3
                  ? "border-gold/20 bg-gold/5"
                  : "border-border"
              }`}
            >
              <span className="text-sm w-8 text-center shrink-0">
                {medalEmoji(globalIndex)}
              </span>
              <UserAvatar
                avatarUrl={profile.avatar_url}
                name={profile.company_name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate hover:text-gold transition-colors">
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
          );
        })}
      </div>

      {(!rankings || rankings.length === 0) && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhum membro no ranking ainda.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
          <Button size="sm" variant="ghost" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground gap-1 font-heading">
            <ChevronLeft size={14} /> Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 flex items-center justify-center text-xs font-heading transition-colors ${p === currentPage ? "bg-gold text-background font-bold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                {p}
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground gap-1 font-heading">
            Próxima <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default RankingPanel;
