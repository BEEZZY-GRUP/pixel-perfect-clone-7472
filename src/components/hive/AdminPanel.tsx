import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield,
  ShieldOff,
  Save,
  Search,
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  Mail,
  Calendar,
  Award,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import CompanyManagement from "./CompanyManagement";

type AdminTab = "empresas" | "membros";
type MemberSort = "name" | "level" | "xp" | "date";
type MemberFilter = "all" | "admin" | "moderator" | "user" | "no-company";

const AdminPanel = () => {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("empresas");
  const [search, setSearch] = useState("");
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ company_name: string; cnpj: string }>({
    company_name: "",
    cnpj: "",
  });
  const [sortBy, setSortBy] = useState<MemberSort>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterBy, setFilterBy] = useState<MemberFilter>("all");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

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

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").order("name");
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const updateProfile = useMutation({
    mutationFn: async ({
      userId,
      company_name,
      cnpj,
    }: {
      userId: string;
      company_name: string;
      cnpj: string;
    }) => {
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

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, add }: { userId: string; role: "admin" | "moderator"; add: boolean }) => {
      if (add) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
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

  const isUserModerator = (userId: string) =>
    roles?.some((r) => r.user_id === userId && r.role === "moderator");

  const getUserRole = (userId: string) => {
    if (isUserAdmin(userId)) return "admin";
    if (isUserModerator(userId)) return "moderator";
    return "user";
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    return companies?.find((c) => c.id === companyId)?.name ?? null;
  };

  // Filter
  let filtered = profiles?.filter((p: any) => {
    if (search) {
      const s = search.toLowerCase();
      const matchName = p.company_name?.toLowerCase().includes(s);
      const matchCnpj = p.cnpj?.includes(s);
      if (!matchName && !matchCnpj) return false;
    }
    if (filterBy === "admin") return isUserAdmin(p.user_id);
    if (filterBy === "moderator") return isUserModerator(p.user_id);
    if (filterBy === "user") return !isUserAdmin(p.user_id) && !isUserModerator(p.user_id);
    if (filterBy === "no-company") return !p.company_id;
    return true;
  });

  // Sort
  filtered = filtered?.sort((a: any, b: any) => {
    let cmp = 0;
    if (sortBy === "name") cmp = (a.company_name || "").localeCompare(b.company_name || "");
    else if (sortBy === "level") cmp = (a.level || 0) - (b.level || 0);
    else if (sortBy === "xp") cmp = (a.xp || 0) - (b.xp || 0);
    else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortAsc ? cmp : -cmp;
  });

  const totalMembers = profiles?.length ?? 0;
  const totalAdmins = profiles?.filter((p: any) => isUserAdmin(p.user_id)).length ?? 0;
  const totalNoCompany = profiles?.filter((p: any) => !p.company_id).length ?? 0;
  const totalCompanies = companies?.length ?? 0;

  const tabs: { key: AdminTab; label: string; icon: typeof Building2; count: number }[] = [
    { key: "empresas", label: "Empresas", icon: Building2, count: totalCompanies },
    { key: "membros", label: "Membros", icon: Users, count: totalMembers },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield size={22} className="text-gold" />
        <h2 className="font-heading text-lg tracking-widest uppercase text-foreground">
          Administração
        </h2>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Empresas", value: totalCompanies, icon: Building2 },
          { label: "Membros", value: totalMembers, icon: Users },
          { label: "Admins", value: totalAdmins, icon: Shield },
          { label: "Sem Empresa", value: totalNoCompany, icon: Filter },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border border-border bg-secondary/30 p-4 text-center"
          >
            <stat.icon size={18} className="text-gold mx-auto mb-1.5" />
            <p className="text-foreground text-2xl font-bold leading-none">{stat.value}</p>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-heading mt-1.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2.5 px-6 py-3.5 text-sm uppercase tracking-widest font-heading transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span
              className={`text-xs px-2 py-0.5 rounded-sm ${
                activeTab === tab.key
                  ? "bg-gold/15 text-gold"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* EMPRESAS TAB */}
      {activeTab === "empresas" && <CompanyManagement />}

      {/* MEMBROS TAB */}
      {activeTab === "membros" && (
        <div className="space-y-4">
          {/* Filters & sort bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar membro..."
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-base h-10"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-1.5">
              {(
                [
                  { key: "all", label: "Todos" },
                  { key: "admin", label: "Admins" },
                  { key: "moderator", label: "Moderadores" },
                  { key: "user", label: "Usuários" },
                  { key: "no-company", label: "Sem Empresa" },
                ] as { key: MemberFilter; label: string }[]
              ).map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterBy(f.key)}
                  className={`text-xs h-9 px-3 uppercase tracking-wider font-heading ${
                    filterBy === f.key
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "text-muted-foreground"
                  }`}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex gap-1.5 items-center">
              {(
                [
                  { key: "date", label: "Data" },
                  { key: "name", label: "Nome" },
                  { key: "level", label: "Level" },
                  { key: "xp", label: "XP" },
                ] as { key: MemberSort; label: string }[]
              ).map((s) => (
                <Button
                  key={s.key}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (sortBy === s.key) setSortAsc(!sortAsc);
                    else {
                      setSortBy(s.key);
                      setSortAsc(false);
                    }
                  }}
                  className={`text-xs h-9 px-3 uppercase tracking-wider font-heading gap-1.5 ${
                    sortBy === s.key
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                  {sortBy === s.key &&
                    (sortAsc ? <SortAsc size={12} /> : <SortDesc size={12} />)}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-heading">
            {filtered?.length ?? 0} resultado{(filtered?.length ?? 0) !== 1 ? "s" : ""}
          </p>

          {/* Member list */}
          <div className="space-y-2">
            {filtered?.map((profile: any) => {
              const admin = isUserAdmin(profile.user_id);
              const moderator = isUserModerator(profile.user_id);
              const role = getUserRole(profile.user_id);
              const isEditing = editingProfile === profile.user_id;
              const isExpanded = expandedMember === profile.user_id;
              const linkedCompany = getCompanyName(profile.company_id);

              return (
                <div key={profile.id} className="border border-border">
                  {/* Member header row */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() =>
                      setExpandedMember(isExpanded ? null : profile.user_id)
                    }
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                      )}

                      {/* Avatar placeholder */}
                      <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                        <span className="text-gold text-sm font-bold uppercase">
                          {(profile.company_name || "U").charAt(0)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <p className="text-foreground text-base font-medium truncate">
                            {profile.company_name}
                          </p>
                          {admin && (
                            <span className="text-xs bg-gold/10 text-gold px-2.5 py-0.5 uppercase tracking-wider font-heading shrink-0">
                              Admin
                            </span>
                          )}
                          {moderator && !admin && (
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-0.5 uppercase tracking-wider font-heading shrink-0">
                              Moderador
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs mt-0.5">
                          <span className="flex items-center gap-1">
                            <Award size={12} />
                            Lv.{profile.level}
                          </span>
                          <span>{profile.xp} XP</span>
                          {linkedCompany && (
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {linkedCompany}
                            </span>
                          )}
                          {!linkedCompany && (
                            <span className="text-destructive/70">Sem empresa</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-xs shrink-0">
                      <Calendar size={13} />
                      {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border p-5 space-y-4 bg-secondary/20">
                      {/* Detail grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: "Nome", value: profile.company_name },
                          { label: "CNPJ", value: profile.cnpj || "—" },
                          { label: "Empresa", value: linkedCompany || "Nenhuma" },
                          {
                            label: "Membro desde",
                            value: new Date(profile.created_at).toLocaleDateString("pt-BR"),
                          },
                          { label: "Nível", value: `${profile.level}` },
                          { label: "XP Total", value: `${profile.xp}` },
                          { label: "Papel", value: admin ? "Administrador" : moderator ? "Moderador" : "Usuário" },
                          { label: "Bio", value: profile.bio || "—" },
                        ].map((d) => (
                          <div key={d.label}>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-heading mb-1">
                              {d.label}
                            </p>
                            <p className="text-foreground text-base truncate">{d.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Edit form */}
                      {isEditing ? (
                        <div className="space-y-3 border-t border-border pt-4">
                          <Input
                            value={editValues.company_name}
                            onChange={(e) =>
                              setEditValues({ ...editValues, company_name: e.target.value })
                            }
                            placeholder="Nome da empresa"
                            className="bg-secondary border-border text-foreground text-base h-10"
                          />
                          <Input
                            value={editValues.cnpj}
                            onChange={(e) =>
                              setEditValues({ ...editValues, cnpj: e.target.value })
                            }
                            placeholder="CNPJ"
                            className="bg-secondary border-border text-foreground text-base h-10"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateProfile.mutate({
                                  userId: profile.user_id,
                                  company_name: editValues.company_name,
                                  cnpj: editValues.cnpj,
                                })
                              }
                              disabled={updateProfile.isPending}
                              className="bg-gold text-background hover:bg-gold-light text-xs tracking-wider uppercase font-heading h-9"
                            >
                              <Save size={14} className="mr-1.5" />
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
                        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProfile(profile.user_id);
                              setEditValues({
                                company_name: profile.company_name,
                                cnpj: profile.cnpj || "",
                              });
                            }}
                            className="text-muted-foreground hover:text-foreground text-[.6rem] h-7 px-3 gap-1 uppercase tracking-wider font-heading"
                          >
                            <Pencil size={10} />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRole.mutate({
                                userId: profile.user_id,
                                role: "admin",
                                add: !admin,
                              });
                            }}
                            disabled={toggleRole.isPending}
                            className={`text-[.6rem] h-7 px-3 gap-1 uppercase tracking-wider font-heading ${
                              admin
                                ? "text-destructive hover:text-destructive"
                                : "text-gold hover:text-gold"
                            }`}
                          >
                            {admin ? <ShieldOff size={10} /> : <Shield size={10} />}
                            {admin ? "Remover admin" : "Tornar admin"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRole.mutate({
                                userId: profile.user_id,
                                role: "moderator",
                                add: !moderator,
                              });
                            }}
                            disabled={toggleRole.isPending}
                            className={`text-[.6rem] h-7 px-3 gap-1 uppercase tracking-wider font-heading ${
                              moderator
                                ? "text-destructive hover:text-destructive"
                                : "text-blue-400 hover:text-blue-400"
                            }`}
                          >
                            {moderator ? <ShieldOff size={10} /> : <Shield size={10} />}
                            {moderator ? "Remover moderador" : "Tornar moderador"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
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
      )}
    </div>
  );
};

export default AdminPanel;
