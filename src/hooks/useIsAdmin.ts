import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin");
      return data === true;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: isModerator, isLoading: isModLoading } = useQuery({
    queryKey: ["is_moderator", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "moderator",
      });
      return data === true;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return {
    isAdmin: isAdmin ?? false,
    isModerator: isModerator ?? false,
    isLoading: isAdminLoading || isModLoading,
  };
}
