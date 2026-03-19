import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Zap, MessageSquare, FileText, Crown, TrendingUp, Users, Award, Sparkles } from "lucide-react";
import { getDailyInsight } from "./dailyInsights";
import { Flame, Zap, MessageSquare, FileText, Crown, TrendingUp, Users, Award } from "lucide-react";

const SidebarWidgets = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["community_stats"],
    queryFn: async () => {
      const [postsRes, commentsRes, profilesRes, badgesRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_badges").select("id", { count: "exact", head: true }),
      ]);
      return { posts: postsRes.count ?? 0, comments: commentsRes.count ?? 0, members: profilesRes.count ?? 0, badgesEarned: badgesRes.count ?? 0 };
    },
    staleTime: 60_000,
  });

  const { data: topMembers } = useQuery({
    queryKey: ["top_3_members"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("company_name, level, xp, avatar_url").order("xp", { ascending: false }).limit(3);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my_quick_profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("level, xp, company_name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: myBadgeCount } = useQuery({
    queryKey: ["my_badge_count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      {myProfile && (
        <div className="border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-gold" />
            <p className="text-[.6rem] font-heading tracking-widest uppercase text-gold">Seu Status</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-foreground text-base font-heading font-bold">{myProfile.level}</p>
              <p className="text-muted-foreground text-[.5rem] uppercase tracking-wider font-heading">Nível</p>
            </div>
            <div className="text-center">
              <p className="text-gold text-base font-heading font-bold">{myProfile.xp}</p>
              <p className="text-muted-foreground text-[.5rem] uppercase tracking-wider font-heading">XP</p>
            </div>
            <div className="text-center">
              <p className="text-foreground text-base font-heading font-bold">{myBadgeCount}</p>
              <p className="text-muted-foreground text-[.5rem] uppercase tracking-wider font-heading">Badges</p>
            </div>
          </div>
        </div>
      )}

      <div className="border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-gold" />
          <p className="text-[.6rem] font-heading tracking-widest uppercase text-gold">Comunidade</p>
        </div>
        <div className="space-y-2">
          {[
            { icon: <Users size={12} />, label: "Membros", value: stats?.members ?? 0 },
            { icon: <FileText size={12} />, label: "Publicações", value: stats?.posts ?? 0 },
            { icon: <MessageSquare size={12} />, label: "Comentários", value: stats?.comments ?? 0 },
            { icon: <Award size={12} />, label: "Badges ganhas", value: stats?.badgesEarned ?? 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-muted-foreground text-[.65rem]">{item.icon}{item.label}</span>
              <span className="text-foreground text-[.7rem] font-heading font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {topMembers && topMembers.length > 0 && (
        <div className="border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={13} className="text-gold" />
            <p className="text-[.6rem] font-heading tracking-widest uppercase text-gold">Top Membros</p>
          </div>
          <div className="space-y-2">
            {topMembers.map((member: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <span className={`text-[.6rem] font-heading font-bold w-5 ${idx === 0 ? "text-gold" : "text-muted-foreground"}`}>#{idx + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-foreground text-[.7rem] truncate">{member.company_name}</p></div>
                <span className="text-gold text-[.6rem] font-heading font-semibold shrink-0">Lv.{member.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-border bg-secondary/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame size={13} className="text-gold" />
          <p className="text-[.6rem] font-heading tracking-widest uppercase text-gold">Dica do Dia</p>
        </div>
        <p className="text-foreground/70 text-[.7rem] leading-relaxed italic">
          "Publique posts e comente para ganhar XP. Complete missões para subir de nível mais rápido e desbloquear badges exclusivas!"
        </p>
      </div>
    </div>
  );
};

export default SidebarWidgets;
