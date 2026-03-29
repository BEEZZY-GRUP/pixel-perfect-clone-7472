import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Trophy, Target, Video, BookOpen, MessageCircle, Plus, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  onCreatePost: () => void;
}

const WelcomeHome = ({ onCreatePost }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: recentPosts } = useQuery({
    queryKey: ["recent_posts_home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, created_at, user_id, is_anonymous, categories!posts_category_id_fkey(name, emoji, slug)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!data?.length) return [];
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, company_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
      return data.map((post) => ({ ...post, profile: profileMap.get(post.user_id) }));
    },
    staleTime: 30_000,
  });

  const { data: activeMissions } = useQuery({
    queryKey: ["active_missions_home", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_missions")
        .select("*, missions(*)")
        .eq("user_id", user!.id)
        .eq("completed", false)
        .limit(3);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: topMembers } = useQuery({
    queryKey: ["top_3_home"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, company_name, level, xp, avatar_url").order("xp", { ascending: false }).limit(3);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const quickLinks = [
    { label: "Comunidade", icon: <MessageCircle size={18} />, path: "?category=geral", color: "text-gold" },
    { label: "Ranking", icon: <Trophy size={18} />, path: "/the-hive/community/ranking", color: "text-gold" },
    { label: "Missões", icon: <Target size={18} />, path: "/the-hive/community/missions", color: "text-gold" },
    { label: "Vídeos", icon: <Video size={18} />, path: "/the-hive/community/videos", color: "text-gold" },
    { label: "Sumário", icon: <BookOpen size={18} />, path: "/the-hive/community/glossary", color: "text-gold" },
  ];

  const currentLevelXp = profile ? ((profile.level - 1) ** 2) * 100 : 0;
  const nextLevelXp = profile ? (profile.level ** 2) * 100 : 100;
  const progressPercent = nextLevelXp > currentLevelXp && profile
    ? ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero greeting */}
      <div className="border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.company_name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-[.7rem] font-heading tracking-wider uppercase">
                {getGreeting()}
              </p>
              <h1 className="text-foreground text-xl font-medium truncate">
                {profile?.company_name ?? "Membro"}
              </h1>
            </div>
            <Button
              onClick={onCreatePost}
              className="bg-gold text-background hover:bg-gold-light font-heading text-[.6rem] tracking-widest uppercase gap-2 shrink-0 hidden sm:flex"
            >
              <Plus size={14} />
              Publicar
            </Button>
            <Button
              onClick={onCreatePost}
              size="icon"
              className="bg-gold text-background hover:bg-gold-light shrink-0 sm:hidden w-8 h-8"
            >
              <Plus size={14} />
            </Button>
          </div>

          {/* XP bar */}
          {profile && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-foreground text-[.7rem] font-heading">Nível {profile.level}</span>
                <span className="text-gold text-[.7rem] font-heading font-semibold">{profile.xp} XP</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <p className="text-muted-foreground text-[.55rem] mt-1 text-right font-heading">
                {nextLevelXp - (profile?.xp ?? 0)} XP para o nível {profile.level + 1}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.path)}
            className="border border-border bg-card hover:border-gold/25 transition-all p-3 md:p-4 flex flex-col items-center gap-1.5 md:gap-2 group"
          >
            <span className="text-muted-foreground group-hover:text-gold transition-colors">{link.icon}</span>
            <span className="text-[.5rem] md:text-[.6rem] font-heading tracking-wider uppercase text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
              {link.label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent posts */}
        <div className="border border-border bg-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-gold" />
              <h2 className="text-[.65rem] font-heading tracking-widest uppercase text-gold">Publicações Recentes</h2>
            </div>
            <button
              onClick={() => navigate("?category=geral")}
              className="text-[.6rem] text-muted-foreground hover:text-gold font-heading tracking-wider uppercase flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowRight size={10} />
            </button>
          </div>
          <div className="space-y-3">
            {recentPosts?.map((post: any) => {
              const isConfessionario = post.categories?.slug === "confessionario";
              const isAnon = isConfessionario || post.is_anonymous;
              return (
                <button
                  key={post.id}
                  onClick={() => navigate(`/the-hive/community/post/${post.id}`)}
                  className="w-full text-left flex items-start gap-3 py-2 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors -mx-1 px-1 rounded-sm"
                >
                  <UserAvatar
                    avatarUrl={isAnon ? null : post.profile?.avatar_url}
                    name={isAnon ? "A" : post.profile?.company_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-[.75rem] font-medium truncate leading-snug">{post.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-gold/60 text-[.55rem] font-heading tracking-wider">
                        {post.categories?.emoji} {post.categories?.name}
                      </span>
                      <span className="text-muted-foreground text-[.55rem]">
                        {isAnon ? "Anônimo" : (post.profile?.company_name || "Membro")} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {(!recentPosts || recentPosts.length === 0) && (
              <p className="text-muted-foreground text-[.7rem] text-center py-4">Nenhuma publicação ainda.</p>
            )}
          </div>
        </div>

        {/* Right column: missions + ranking */}
        <div className="space-y-6">
          {/* Active missions */}
          <div className="border border-border bg-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-gold" />
                <h2 className="text-[.65rem] font-heading tracking-widest uppercase text-gold">Missões Ativas</h2>
              </div>
              <button
                onClick={() => navigate("/the-hive/community/missions")}
                className="text-[.6rem] text-muted-foreground hover:text-gold font-heading tracking-wider uppercase flex items-center gap-1 transition-colors"
              >
                Ver todas <ArrowRight size={10} />
              </button>
            </div>
            <div className="space-y-3">
              {activeMissions?.map((um: any) => {
                const mission = um.missions;
                if (!mission) return null;
                const pct = mission.target_count > 0 ? Math.min(100, (um.progress / mission.target_count) * 100) : 0;
                return (
                  <div key={um.id} className="flex items-center gap-3">
                    <span className="text-lg">{mission.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-[.7rem] font-medium truncate">{mission.title}</p>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-muted-foreground text-[.55rem] font-heading shrink-0">
                      {um.progress}/{mission.target_count}
                    </span>
                  </div>
                );
              })}
              {(!activeMissions || activeMissions.length === 0) && (
                <p className="text-muted-foreground text-[.7rem] text-center py-2">Nenhuma missão ativa.</p>
              )}
            </div>
          </div>

          {/* Top 3 ranking */}
          <div className="border border-border bg-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-gold" />
                <h2 className="text-[.65rem] font-heading tracking-widest uppercase text-gold">Top Membros</h2>
              </div>
              <button
                onClick={() => navigate("/the-hive/community/ranking")}
                className="text-[.6rem] text-muted-foreground hover:text-gold font-heading tracking-wider uppercase flex items-center gap-1 transition-colors"
              >
                Ver ranking <ArrowRight size={10} />
              </button>
            </div>
            <div className="space-y-3">
              {topMembers?.map((member: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/the-hive/community/profile/${member.user_id}`)}
                  className="flex items-center gap-3 w-full text-left hover:bg-secondary/30 -mx-1 px-1 py-1 rounded-sm transition-colors"
                >
                  <span className={`text-[.65rem] font-heading font-bold w-5 ${idx === 0 ? "text-gold" : "text-muted-foreground"}`}>
                    #{idx + 1}
                  </span>
                  <UserAvatar avatarUrl={member.avatar_url} name={member.company_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-[.7rem] truncate hover:text-gold transition-colors">{member.company_name}</p>
                  </div>
                  <span className="text-gold text-[.6rem] font-heading font-semibold shrink-0">Lv.{member.level}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHome;
