import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Save,
  Trash2,
  Search,
  UserPlus,
  UserMinus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Mail,
  Send,
  X,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  company_name: string;
  name: string | null;
  company_id: string | null;
  cnpj: string | null;
  level: number;
  xp: number;
}

const CompanyManagement = () => {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", cnpj: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: "", cnpj: "" });
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [invitingCompany, setInvitingCompany] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      return (data ?? []) as Company[];
    },
    enabled: isAdmin,
  });

  const { data: profiles } = useQuery({
    queryKey: ["all_profiles_for_companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, company_name, name, company_id, cnpj, level, xp")
        .order("company_name");
      return (data ?? []) as Profile[];
    },
    enabled: isAdmin,
  });

  const { data: userEmails } = useQuery({
    queryKey: ["user_emails"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_user_emails");
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    queryClient.invalidateQueries({ queryKey: ["all_profiles_for_companies"] });
    queryClient.invalidateQueries({ queryKey: ["all_profiles"] });
  };

  const createCompany = useMutation({
    mutationFn: async (vals: { name: string; cnpj: string }) => {
      const { error } = await supabase.from("companies").insert({
        name: vals.name,
        cnpj: vals.cnpj || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa criada!");
      invalidateAll();
      setCreating(false);
      setNewCompany({ name: "", cnpj: "" });
    },
    onError: () => toast.error("Erro ao criar empresa."),
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, name, cnpj }: { id: string; name: string; cnpj: string }) => {
      const { error } = await supabase
        .from("companies")
        .update({ name, cnpj: cnpj || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa atualizada!");
      invalidateAll();
      setEditingId(null);
    },
    onError: () => toast.error("Erro ao atualizar empresa."),
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ company_id: null })
        .eq("company_id", id);
      if (profileErr) throw profileErr;

      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa excluída!");
      invalidateAll();
      setExpandedCompany(null);
    },
    onError: () => toast.error("Erro ao excluir empresa."),
  });

  const addMember = useMutation({
    mutationFn: async ({ profileId, companyId }: { profileId: string; companyId: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ company_id: companyId })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro adicionado!");
      invalidateAll();
      setAddingMember(null);
    },
    onError: () => toast.error("Erro ao adicionar membro."),
  });

  const removeMember = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ company_id: null })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido!");
      invalidateAll();
    },
    onError: () => toast.error("Erro ao remover membro."),
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, companyId }: { email: string; companyId: string }) => {
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: { email: email.trim(), company_id: companyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(`Convite enviado para ${inviteEmail}!`);
      setInviteEmail("");
      setInvitingCompany(null);
      invalidateAll();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao enviar convite.");
    },
  });

  if (!isAdmin) return null;

  const filtered = companies?.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj && c.cnpj.includes(search))
  );

  const getMembersOf = (companyId: string) =>
    profiles?.filter((p) => p.company_id === companyId) ?? [];

  const unassigned = profiles?.filter((p) => !p.company_id) ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-gold" />
          <h2 className="font-heading text-sm tracking-widest uppercase text-foreground">
            Empresas
          </h2>
        </div>
        <Button
          size="sm"
          onClick={() => setCreating(true)}
          className="bg-gold text-background hover:bg-gold-light font-heading text-[.6rem] tracking-widest uppercase gap-1 h-7"
        >
          <Plus size={12} />
          Nova Empresa
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="border border-gold/30 p-4 space-y-2">
          <Input
            value={newCompany.name}
            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            placeholder="Nome da empresa"
            className="bg-secondary border-border text-foreground text-sm"
          />
          <Input
            value={newCompany.cnpj}
            onChange={(e) => setNewCompany({ ...newCompany, cnpj: e.target.value })}
            placeholder="CNPJ"
            className="bg-secondary border-border text-foreground text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createCompany.mutate(newCompany)}
              disabled={!newCompany.name || createCompany.isPending}
              className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-7"
            >
              <Save size={12} className="mr-1" />
              Criar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setCreating(false); setNewCompany({ name: "", cnpj: "" }); }}
              className="text-muted-foreground text-[.6rem] h-7"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empresa..."
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Company list */}
      <div className="space-y-2">
        {filtered?.map((company) => {
          const isExpanded = expandedCompany === company.id;
          const isEditing = editingId === company.id;
          const members = getMembersOf(company.id);
          const isInviting = invitingCompany === company.id;

          return (
            <div key={company.id} className="border border-border">
              {/* Company header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isExpanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">{company.name}</p>
                    <p className="text-muted-foreground text-[.65rem]">
                      {company.cnpj || "Sem CNPJ"} · {members.length} membro{members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(company.id);
                      setEditValues({ name: company.name, cnpj: company.cnpj || "" });
                      setExpandedCompany(company.id);
                    }}
                    className="text-muted-foreground hover:text-foreground h-7 px-2"
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Excluir "${company.name}"?`)) {
                        deleteCompany.mutate(company.id);
                      }
                    }}
                    disabled={deleteCompany.isPending}
                    className="text-destructive hover:text-destructive h-7 px-2"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-3">
                  {/* Edit form */}
                  {isEditing && (
                    <div className="space-y-2 pb-3 border-b border-border">
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
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
                          onClick={() => updateCompany.mutate({ id: company.id, ...editValues })}
                          disabled={!editValues.name || updateCompany.isPending}
                          className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-7"
                        >
                          <Save size={12} className="mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="text-muted-foreground text-[.6rem] h-7"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Invite by email */}
                  <div className="border border-gold/20 bg-gold/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-gold" />
                        <p className="text-[.7rem] text-gold uppercase tracking-wider font-heading">
                          Convidar por E-mail
                        </p>
                      </div>
                      {!isInviting && (
                        <Button
                          size="sm"
                          onClick={() => setInvitingCompany(company.id)}
                          className="bg-gold text-background hover:bg-gold-light h-6 px-3 text-[.6rem] tracking-wider uppercase font-heading gap-1"
                        >
                          <UserPlus size={10} />
                          Convidar
                        </Button>
                      )}
                    </div>
                    {isInviting && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (inviteEmail.trim()) {
                            inviteMember.mutate({ email: inviteEmail, companyId: company.id });
                          }
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm flex-1"
                          required
                          autoFocus
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={inviteMember.isPending || !inviteEmail.trim()}
                          className="bg-gold text-background hover:bg-gold-light h-9 px-3 text-[.6rem] tracking-wider uppercase font-heading gap-1"
                        >
                          <Send size={10} />
                          {inviteMember.isPending ? "..." : "Enviar"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => { setInvitingCompany(null); setInviteEmail(""); }}
                          className="text-muted-foreground h-9 px-2"
                        >
                          <X size={12} />
                        </Button>
                      </form>
                    )}
                    <p className="text-muted-foreground text-[.55rem]">
                      O membro receberá um e-mail para criar senha e acessar. Será vinculado automaticamente a <strong className="text-gold">{company.name}</strong>.
                    </p>
                  </div>

                  {/* Members */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[.7rem] text-muted-foreground uppercase tracking-wider font-heading">
                        Membros ({members.length})
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddingMember(addingMember === company.id ? null : company.id)}
                        className="text-gold hover:text-gold h-6 px-2 text-[.6rem] tracking-wider uppercase font-heading gap-1"
                      >
                        <UserPlus size={12} />
                        Vincular existente
                      </Button>
                    </div>

                    {/* Add existing member dropdown */}
                    {addingMember === company.id && unassigned.length > 0 && (
                      <div className="border border-border p-2 mb-2 max-h-[200px] overflow-y-auto space-y-1 scrollbar-gold">
                        <p className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 px-1">
                          Usuários sem empresa
                        </p>
                        {unassigned.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => addMember.mutate({ profileId: p.id, companyId: company.id })}
                            className="w-full text-left px-2 py-1.5 text-sm text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-between"
                          >
                            <span>{p.company_name}</span>
                            <UserPlus size={12} className="text-gold shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {addingMember === company.id && unassigned.length === 0 && (
                      <p className="text-[.65rem] text-muted-foreground mb-2 px-1">
                        Todos os usuários já pertencem a uma empresa.
                      </p>
                    )}

                    {members.length === 0 ? (
                      <p className="text-[.65rem] text-muted-foreground">Nenhum membro nesta empresa.</p>
                    ) : (
                      <div className="space-y-1">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between py-1.5 px-2 hover:bg-secondary/50 transition-colors"
                          >
                            <div>
                              <p className="text-foreground text-sm">{member.company_name}</p>
                              <p className="text-muted-foreground text-[.6rem]">
                                Lv.{member.level} · {member.xp} XP
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/the-hive/community/profile/${member.user_id}`)}
                                className="text-gold hover:text-gold-light h-6 px-2"
                                title="Ver Perfil"
                              >
                                <Eye size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMember.mutate(member.id)}
                                disabled={removeMember.isPending}
                                className="text-destructive hover:text-destructive h-6 px-2"
                              >
                                <UserMinus size={12} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(!filtered || filtered.length === 0) && !creating && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhuma empresa cadastrada.
        </p>
      )}
    </div>
  );
};

export default CompanyManagement;
