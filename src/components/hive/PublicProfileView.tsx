import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UserAvatar from "./UserAvatar";
import RoleBadge from "./RoleBadge";
import BadgesPanel from "./BadgesPanel";
import { ArrowLeft, FileText, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  onBack: () => void;
}

const PublicProfileView = ({ userId, onBack }: Props) => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public_profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["public_user_stats", userId],
    queryFn: async () => {
      const [postsRes, commentsRes, missionsRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("user_missions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
      ]);
      return {
        posts: postsRes.count ?? 0,
        comments: commentsRes.count ?? 0,
        missions: missionsRes.count ?? 0,
      };
    },
  });


  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-secondary" />
        <div className="h-40 bg-secondary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4 gap-2">
          <ArrowLeft size={14} /> Voltar
        </Button>
      </div>
    );
  }

  const currentLevelXp = ((profile.level - 1) ** 2) * 100;
  const nextLevelXp = (profile.level ** 2) * 100;
  const progressPercent = nextLevelXp > currentLevelXp
    ? ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground text-[.65rem] tracking-wider uppercase font-heading h-8 gap-1 -ml-2">
        <ArrowLeft size={14} /> Voltar
      </Button>

      <div className="border border-border bg-card">
        <div className="h-20 bg-gradient-to-br from-gold/20 via-gold/5 to-transparent" />
        <div className="px-6 pb-6 -mt-10">
          <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-secondary mb-4">
            <UserAvatar
              avatarUrl={profile.avatar_url}
              name={profile.company_name}
              size="lg"
              className="w-full h-full text-lg"
            />
          </div>

          {(profile as any).name && (
            <h2 className="text-foreground text-lg font-medium">{(profile as any).name}</h2>
          )}
          <p className={`text-muted-foreground text-sm ${(profile as any).name ? "mt-0.5" : ""}`}>
            {!(profile as any).name && <span className="text-foreground text-lg font-medium">{profile.company_name}</span>}
            {(profile as any).name && profile.company_name}
          </p>
          {profile.bio && (
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{profile.bio}</p>
          )}

          {/* Level & XP */}
          <div className="bg-secondary/50 border border-border p-4 mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground text-sm font-heading">Nível {profile.level}</span>
              <span className="text-gold text-sm font-heading font-semibold">{profile.xp} XP</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Posts", value: stats?.posts ?? 0, icon: <FileText size={14} /> },
              { label: "Comentários", value: stats?.comments ?? 0, icon: <MessageSquare size={14} /> },
              { label: "Missões", value: stats?.missions ?? 0, icon: <Target size={14} /> },
            ].map((stat) => (
              <div key={stat.label} className="text-center border border-border p-3">
                <p className="text-foreground text-lg font-heading font-semibold">{stat.value}</p>
                <p className="text-muted-foreground text-[.6rem] uppercase tracking-wider font-heading">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges with click-to-see-date */}
      <BadgesPanel userId={userId} />
    </div>
  );
};

export default PublicProfileView;
