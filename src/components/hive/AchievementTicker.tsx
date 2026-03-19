import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Achievement {
  text: string;
  emoji: string;
}

const AchievementTicker = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Fetch recent level-ups (profiles updated recently with level > 1)
  const { data: achievements } = useQuery({
    queryKey: ["recent_achievements"],
    queryFn: async () => {
      const items: Achievement[] = [];

      // Recent badges earned (last 7 days)
      const { data: recentBadges } = await supabase
        .from("user_badges")
        .select("earned_at, badge_id, user_id")
        .gte("earned_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("earned_at", { ascending: false })
        .limit(20);

      if (recentBadges?.length) {
        const userIds = [...new Set(recentBadges.map((b) => b.user_id))];
        const badgeIds = [...new Set(recentBadges.map((b) => b.badge_id))];

        const [profilesRes, badgesRes] = await Promise.all([
          supabase.from("profiles").select("user_id, company_name").in("user_id", userIds),
          supabase.from("badges").select("id, name, emoji").in("id", badgeIds),
        ]);

        const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) ?? []);
        const badgeMap = new Map(badgesRes.data?.map((b) => [b.id, b]) ?? []);

        for (const ub of recentBadges) {
          const profile = profileMap.get(ub.user_id);
          const badge = badgeMap.get(ub.badge_id);
          if (profile && badge) {
            items.push({
              text: `${profile.company_name} desbloqueou "${badge.name}"`,
              emoji: badge.emoji,
            });
          }
        }
      }

      // Recent level-ups: profiles with high XP (approximate — show top earners)
      const { data: topProfiles } = await supabase
        .from("profiles")
        .select("company_name, level, xp")
        .gt("level", 1)
        .order("xp", { ascending: false })
        .limit(10);

      if (topProfiles?.length) {
        for (const p of topProfiles) {
          items.push({
            text: `${p.company_name} atingiu o Nível ${p.level}`,
            emoji: "⭐",
          });
        }
      }

      // Recent completed missions
      const { data: completedMissions } = await supabase
        .from("user_missions")
        .select("user_id, mission_id, completed_at")
        .eq("completed", true)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (completedMissions?.length) {
        const userIds = [...new Set(completedMissions.map((m) => m.user_id))];
        const missionIds = [...new Set(completedMissions.map((m) => m.mission_id))];

        const [profilesRes, missionsRes] = await Promise.all([
          supabase.from("profiles").select("user_id, company_name").in("user_id", userIds),
          supabase.from("missions").select("id, title, emoji").in("id", missionIds),
        ]);

        const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) ?? []);
        const missionMap = new Map(missionsRes.data?.map((m) => [m.id, m]) ?? []);

        for (const cm of completedMissions) {
          const profile = profileMap.get(cm.user_id);
          const mission = missionMap.get(cm.mission_id);
          if (profile && mission) {
            items.push({
              text: `${profile.company_name} completou "${mission.title}"`,
              emoji: mission.emoji,
            });
          }
        }
      }

      // Shuffle for variety
      return items.sort(() => Math.random() - 0.5);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!achievements?.length || !innerRef.current || !containerRef.current) return;

    const inner = innerRef.current;
    const totalWidth = inner.scrollWidth / 2; // We duplicate content

    gsap.killTweensOf(inner);
    gsap.set(inner, { x: 0 });
    gsap.to(inner, {
      x: -totalWidth,
      duration: achievements.length * 4,
      ease: "none",
      repeat: -1,
    });

    return () => {
      gsap.killTweensOf(inner);
    };
  }, [achievements]);

  if (!achievements?.length) return null;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden bg-gold/5 border-b border-gold/10 py-1.5"
    >
      <div ref={innerRef} className="flex whitespace-nowrap">
        {/* Render twice for seamless loop */}
        {[...achievements, ...achievements].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 mx-6 text-[.65rem] font-heading tracking-wide"
          >
            <span className="text-sm">{item.emoji}</span>
            <span className="text-gold/80">{item.text}</span>
            <span className="text-gold/20 mx-4">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default AchievementTicker;
