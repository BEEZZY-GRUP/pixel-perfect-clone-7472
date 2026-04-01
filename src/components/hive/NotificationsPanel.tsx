import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Bell, MessageCircle, Heart, Megaphone, Check, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig = {
  comment_on_post: { icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-400/10" },
  reaction_on_post: { icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
  announcement: { icon: Megaphone, color: "text-gold", bg: "bg-gold/10" },
} as const;

const NotificationsPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["unread_notifications", user?.id] });
    },
    onError: () => toast.error("Erro ao excluir notificação."),
  });

  const deleteAllNotifications = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["unread_notifications", user?.id] });
      toast.success("Todas as notificações foram excluídas.");
    },
    onError: () => toast.error("Erro ao excluir notificações."),
  });

  const handleClick = (notif: any) => {
    if (!notif.read) markAsRead.mutate(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-gold shrink-0" />
          <h2 className="font-heading text-base sm:text-lg tracking-widest uppercase text-foreground">
            Notificações
          </h2>
          {unreadCount > 0 && (
            <span className="bg-gold text-background text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-[.6rem] sm:text-xs h-8 sm:h-9 px-3 sm:px-4 uppercase tracking-wider font-heading text-muted-foreground hover:text-foreground gap-1.5"
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">Marcar lidas</span>
            </Button>
          )}
          {notifications && notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAllNotifications.mutate()}
              disabled={deleteAllNotifications.isPending}
              className="text-[.6rem] sm:text-xs h-8 sm:h-9 px-3 sm:px-4 uppercase tracking-wider font-heading text-destructive/70 hover:text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Excluir todas</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="text-center py-16">
          <Bell size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Nenhuma notificação ainda.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Você será notificado quando alguém interagir com seus posts.
          </p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="space-y-1">
          {notifications.map((notif) => {
            const type = notif.type as keyof typeof typeConfig;
            const config = typeConfig[type] ?? typeConfig.comment_on_post;
            const Icon = config.icon;

            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left flex items-start gap-4 p-4 border transition-colors rounded-sm ${
                  notif.read
                    ? "border-transparent hover:bg-secondary/50"
                    : "border-gold/20 bg-gold/5 hover:bg-gold/10"
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${notif.read ? "text-muted-foreground" : "text-foreground"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                    )}
                  </div>
                  {notif.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead.mutate(notif.id);
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 shrink-0"
                    title="Marcar como lida"
                  >
                    <Check size={14} />
                  </button>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
