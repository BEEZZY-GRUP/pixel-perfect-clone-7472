import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BadgesPanel from "./BadgesPanel";
import { User } from "lucide-react";

const ProfilePanel = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["user_stats", user?.id],
    queryFn: async () => {
      const [postsRes, commentsRes, missionsRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("user_missions").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("completed", true),
      ]);
      return {
        posts: postsRes.count ?? 0,
        comments: commentsRes.count ?? 0,
        missions: missionsRes.count ?? 0,
      };
    },
    enabled: !!user,
  });

  if (!profile) return null;

  // XP progress to next level
  const currentLevelXp = ((profile.level - 1) ** 2) * 100;
  const nextLevelXp = (profile.level ** 2) * 100;
  const progressPercent = nextLevelXp > currentLevelXp
    ? ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="border border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={24} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-foreground text-lg font-medium">{profile.company_name}</h2>
            {profile.cnpj && (
              <p className="text-muted-foreground text-xs">{profile.cnpj}</p>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-muted-foreground text-sm mb-4">{profile.bio}</p>
        )}

        {/* Level & XP */}
        <div className="bg-secondary/50 border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground text-sm font-heading">
              Nível {profile.level}
            </span>
            <span className="text-gold text-sm font-heading font-semibold">
              {profile.xp} XP
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <p className="text-muted-foreground text-[.6rem] mt-1 text-right">
            {nextLevelXp - profile.xp} XP para o nível {profile.level + 1}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Posts", value: stats?.posts ?? 0 },
            { label: "Comentários", value: stats?.comments ?? 0 },
            { label: "Missões", value: stats?.missions ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="text-center border border-border p-3">
              <p className="text-foreground text-lg font-heading font-semibold">{stat.value}</p>
              <p className="text-muted-foreground text-[.6rem] uppercase tracking-wider font-heading">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <BadgesPanel />
    </div>
  );
};

export default ProfilePanel;
