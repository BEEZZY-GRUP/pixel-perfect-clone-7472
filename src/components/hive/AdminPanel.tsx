import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, ShieldOff, Save, Search } from "lucide-react";
import { useState } from "react";
import InvitePanel from "./InvitePanel";
import CompanyManagement from "./CompanyManagement";

const AdminPanel = () => {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ company_name: string; cnpj: string }>({ company_name: "", cnpj: "" });

  const { data: profiles } = useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const { data: roles } = useQuery({
    queryKey: ["all_roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const updateProfile = useMutation({
    mutationFn: async ({ userId, company_name, cnpj }: { userId: string; company_name: string; cnpj: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ company_name, cnpj })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["all_profiles"] });
      setEditingProfile(null);
    },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Papel atualizado!");
      queryClient.invalidateQueries({ queryKey: ["all_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["all_roles"] });
    },
    onError: () => toast.error("Erro ao atualizar papel."),
  });

  if (!isAdmin) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-muted-foreground text-sm">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const isUserAdmin = (userId: string) =>
    roles?.some((r) => r.user_id === userId && r.role === "admin");

  const filtered = profiles?.filter((p) =>
    !search || p.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.cnpj && p.cnpj.includes(search))
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Shield size={16} className="text-gold" />
        <h2 className="font-heading text-sm tracking-widest uppercase text-foreground">
          Administração
        </h2>
      </div>

      <InvitePanel />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar membro..."
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        {filtered?.map((profile: any) => {
          const admin = isUserAdmin(profile.user_id);
          const isEditing = editingProfile === profile.user_id;

          return (
            <div key={profile.id} className="border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editValues.company_name}
                        onChange={(e) => setEditValues({ ...editValues, company_name: e.target.value })}
                        placeholder="Nome da empresa"
                        className="bg-secondary border-border text-foreground text-sm"
                      />
                      <Input
                        value={editValues.cnpj}
                        onChange={(e) => setEditValues({ ...editValues, cnpj: e.target.value })}
                        placeholder="CNPJ"
                        className="bg-secondary border-border text-foreground text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateProfile.mutate({
                            userId: profile.user_id,
                            company_name: editValues.company_name,
                            cnpj: editValues.cnpj,
                          })}
                          disabled={updateProfile.isPending}
                          className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-7"
                        >
                          <Save size={12} className="mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingProfile(null)}
                          className="text-muted-foreground text-[.6rem] h-7"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-foreground text-sm font-medium">
                          {profile.company_name}
                        </p>
                        {admin && (
                          <span className="text-[.6rem] bg-gold/10 text-gold px-2 py-0.5 uppercase tracking-wider font-heading">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[.7rem]">
                        {profile.cnpj || "Sem CNPJ"}
                      </p>
                      <p className="text-muted-foreground text-[.6rem]">
                        Lv.{profile.level} · {profile.xp} XP
                      </p>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingProfile(profile.user_id);
                        setEditValues({
                          company_name: profile.company_name,
                          cnpj: profile.cnpj || "",
                        });
                      }}
                      className="text-muted-foreground hover:text-foreground text-[.6rem] h-7 px-2"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleAdmin.mutate({
                        userId: profile.user_id,
                        makeAdmin: !admin,
                      })}
                      disabled={toggleAdmin.isPending}
                      className={`text-[.6rem] h-7 px-2 ${admin ? "text-destructive hover:text-destructive" : "text-gold hover:text-gold"}`}
                    >
                      {admin ? <ShieldOff size={12} /> : <Shield size={12} />}
                      <span className="ml-1">{admin ? "Remover admin" : "Tornar admin"}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(!filtered || filtered.length === 0) && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhum membro encontrado.
        </p>
      )}
    </div>
  );
};

export default AdminPanel;
