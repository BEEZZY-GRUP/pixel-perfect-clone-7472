import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin");
      return data === true;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return { isAdmin: isAdmin ?? false, isLoading };
}
