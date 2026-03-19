import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

interface BadgeInfo {
  name: string;
  emoji: string;
  description: string | null;
  xp_reward: number;
}

const BadgeUnlockCelebration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [badge, setBadge] = useState<BadgeInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setBadge(null), 400);
  }, []);

  // Auto-dismiss after 6s
  useEffect(() => {
    if (visible) {
      const t = setTimeout(dismiss, 6000);
      return () => clearTimeout(t);
    }
  }, [visible, dismiss]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("badge_unlock")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const badgeId = payload.new.badge_id;
          const { data } = await supabase
            .from("badges")
            .select("name, emoji, description, xp_reward")
            .eq("id", badgeId)
            .maybeSingle();

          if (data) {
            setBadge(data);
            setVisible(true);
            queryClient.invalidateQueries({ queryKey: ["user_badges"] });
            queryClient.invalidateQueries({ queryKey: ["my_badge_count"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return (
    <AnimatePresence>
      {visible && badge && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
            onClick={dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative pointer-events-auto w-[340px] max-w-[90vw] border border-gold/30 bg-card rounded-lg overflow-hidden shadow-[0_0_60px_-10px_hsl(var(--gold)/0.25)]"
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            {/* Top glow bar */}
            <div className="h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40" />

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <div className="px-6 pt-8 pb-6 text-center">
              {/* Sparkle label */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <Sparkles size={14} className="text-gold" />
                <span className="text-[.6rem] font-heading tracking-[.25em] uppercase text-gold">
                  Insígnia Desbloqueada
                </span>
                <Sparkles size={14} className="text-gold" />
              </div>

              {/* Animated emoji */}
              <motion.div
                className="text-6xl mb-4 leading-none"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.15 }}
              >
                {badge.emoji}
              </motion.div>

              {/* Badge name */}
              <motion.h2
                className="text-foreground font-heading text-lg font-bold tracking-wide mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {badge.name}
              </motion.h2>

              {/* Description */}
              {badge.description && (
                <motion.p
                  className="text-muted-foreground text-sm leading-relaxed mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  {badge.description}
                </motion.p>
              )}

              {/* XP reward */}
              {badge.xp_reward > 0 && (
                <motion.div
                  className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <span className="text-gold text-xs font-heading font-bold">
                    +{badge.xp_reward} XP
                  </span>
                </motion.div>
              )}
            </div>

            {/* Particle decorations */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-gold/40"
                style={{
                  left: `${15 + i * 15}%`,
                  top: "20%",
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [-10, -40 - i * 8],
                  x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.2 + i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BadgeUnlockCelebration;
