import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Target, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MissionsPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: missions } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("missions")
        .select("*")
        .eq("active", true)
        .order("mission_type")
        .order("xp_reward");
      return data ?? [];
    },
  });

  const { data: userMissions } = useQuery({
    queryKey: ["user_missions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const startMission = useMutation({
    mutationFn: async (missionId: string) => {
      const { error } = await supabase.from("user_missions").insert({
        user_id: user!.id,
        mission_id: missionId,
        progress: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_missions"] });
      toast.success("Missão aceita! 🎯");
    },
    onError: () => toast.error("Erro ao aceitar missão."),
  });

  const getUserMission = (missionId: string) =>
    userMissions?.find((um) => um.mission_id === missionId);

  const typeLabel = (type: string) => {
    switch (type) {
      case "onetime": return "Única";
      case "weekly": return "Semanal";
      case "monthly": return "Mensal";
      default: return type;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "onetime": return "text-gold";
      case "weekly": return "text-green-400";
      case "monthly": return "text-blue-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Target size={16} className="text-gold" />
        <h2 className="font-heading text-sm tracking-widest uppercase text-foreground">
          Missões
        </h2>
      </div>

      <div className="space-y-2">
        {missions?.map((mission) => {
          const um = getUserMission(mission.id);
          const isCompleted = um?.completed;
          const isStarted = !!um;
          const progress = um?.progress ?? 0;

          return (
            <div
              key={mission.id}
              className={`border p-4 transition-colors ${
                isCompleted
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-border hover:border-gold/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span>{mission.emoji}</span>
                    <span className="text-foreground text-sm font-medium break-words">
                      {mission.title}
                    </span>
                    <span className={`text-[.55rem] sm:text-[.6rem] uppercase tracking-wider font-heading ${typeColor(mission.mission_type)}`}>
                      {typeLabel(mission.mission_type)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">
                    {mission.description}
                  </p>

                  {/* Progress bar */}
                  {isStarted && !isCompleted && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold transition-all"
                          style={{
                            width: `${Math.min(100, (progress / mission.target_count) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[.65rem] text-muted-foreground shrink-0">
                        {progress}/{mission.target_count}
                      </span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <Check size={12} />
                      <span>Completada!</span>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-gold text-xs font-heading font-semibold">
                    +{mission.xp_reward} XP
                  </div>
                  {!isStarted && (
                    <Button
                      size="sm"
                      onClick={() => startMission.mutate(mission.id)}
                      disabled={startMission.isPending}
                      className="mt-2 bg-gold/10 text-gold hover:bg-gold/20 text-[.6rem] tracking-wider uppercase font-heading h-7 px-3"
                    >
                      Aceitar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionsPanel;
