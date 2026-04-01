import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import BadgesPanel from "./BadgesPanel";
import UserAvatar from "./UserAvatar";
import RoleBadge from "./RoleBadge";
import OnboardingTutorial from "./OnboardingTutorial";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Save, X, Camera, Loader2, User, Settings, FileText, MessageSquare, Target, Eye, EyeOff } from "lucide-react";
import { useState, useRef } from "react";

type Tab = "profile" | "account";

const ProfilePanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(searchParams.get("onboarding") === "true");
  const [editValues, setEditValues] = useState({ name: "", company_name: "", bio: "" });

  // Account tab state
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

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

  const { data: userRole } = useQuery({
    queryKey: ["user_role", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).maybeSingle();
      return data?.role ?? null;
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

  const updateProfile = useMutation({
    mutationFn: async (vals: { name: string; company_name: string; bio: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: vals.name || null,
          company_name: vals.company_name,
          bio: vals.bio || null,
        } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setEditing(false);
    },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB."); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Foto atualizada!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar foto.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startEditing = () => {
    if (!profile) return;
    const profileName = profile.name || "";
    const companyName = profile.company_name || "";
    setEditValues({
      name: profileName || companyName,
      company_name: profileName ? companyName : "",
      bio: profile.bio || "",
    });
    setEditing(true);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) { toast.error("Digite o novo e-mail."); return; }
    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("E-mail de confirmação enviado para o novo endereço.");
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar e-mail.");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error("Preencha todos os campos."); return; }
    if (newPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem."); return; }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!profile) return null;

  const currentLevelXp = ((profile.level - 1) ** 2) * 100;
  const nextLevelXp = (profile.level ** 2) * 100;
  const progressPercent = nextLevelXp > currentLevelXp
    ? ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    searchParams.delete("onboarding");
    setSearchParams(searchParams, { replace: true });
    startEditing();
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Perfil", icon: <User size={14} /> },
    { key: "account", label: "Conta", icon: <Settings size={14} /> },
  ];

  return (
    <div className="space-y-8">
      {showOnboarding && <OnboardingTutorial onComplete={handleOnboardingComplete} />}

      {/* Tab switcher */}
      <div className="flex gap-1 border border-border bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[.65rem] tracking-wider uppercase font-heading transition-colors flex-1 justify-center ${
              activeTab === tab.key
                ? "bg-gold/10 text-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <>
          {/* Profile header */}
          <div className="border border-border bg-card">
            <div className="h-20 bg-gradient-to-br from-gold/20 via-gold/5 to-transparent" />
            <div className="px-3 sm:px-6 pb-4 sm:pb-6 -mt-10">
              <div className="flex items-end justify-between mb-4">
                <div className="relative group" data-onboarding="avatar">
                  <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-secondary">
                    <UserAvatar avatarUrl={profile.avatar_url} name={getDisplayName(profile)} size="lg" className="w-full h-full text-lg" />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    {uploading ? <Loader2 size={18} className="text-gold animate-spin" /> : <Camera size={18} className="text-foreground" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>

                {!editing && (
                  <Button
                    data-onboarding="edit"
                    size="sm"
                    variant="ghost"
                    onClick={startEditing}
                    className="text-muted-foreground hover:text-foreground text-[.6rem] tracking-wider uppercase font-heading h-7 gap-1"
                  >
                    <Pencil size={12} /> Editar perfil
                  </Button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">Nome</label>
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      placeholder="Seu nome"
                      className="bg-secondary border-border text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">Empresa</label>
                    <Input
                      value={editValues.company_name}
                      onChange={(e) => setEditValues({ ...editValues, company_name: e.target.value })}
                      placeholder="Nome da empresa"
                      className="bg-secondary border-border text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">Bio</label>
                    <Textarea
                      value={editValues.bio}
                      onChange={(e) => setEditValues({ ...editValues, bio: e.target.value })}
                      placeholder="Conte um pouco sobre você ou sua empresa..."
                      className="bg-secondary border-border text-foreground text-sm min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => updateProfile.mutate(editValues)}
                      disabled={!editValues.company_name || updateProfile.isPending}
                      className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-8 gap-1"
                    >
                      <Save size={12} /> Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-muted-foreground text-[.6rem] h-8 gap-1">
                      <X size={12} /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(profile as any).name ? (
                      <h2 className="text-foreground text-lg font-medium">{(profile as any).name}</h2>
                    ) : (
                      <h2 className="text-foreground text-lg font-medium">{profile.company_name}</h2>
                    )}
                    {userRole && userRole !== "user" && <RoleBadge role={userRole} size="md" />}
                  </div>
                  {(profile as any).name && (
                    <p className="text-muted-foreground text-sm mt-0.5">{profile.company_name}</p>
                  )}
                  {profile.bio && (
                    <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{profile.bio}</p>
                  )}
                </>
              )}

              {/* Level & XP */}
              <div className="bg-secondary/50 border border-border p-4 mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground text-sm font-heading">Nível {profile.level}</span>
                  <span className="text-gold text-sm font-heading font-semibold">{profile.xp} XP</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all" style={{ width: `${Math.min(100, progressPercent)}%` }} />
                </div>
                <p className="text-muted-foreground text-[.6rem] mt-1 text-right">{nextLevelXp - profile.xp} XP para o nível {profile.level + 1}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Posts", value: stats?.posts ?? 0, icon: <FileText size={14} /> },
                  { label: "Comentários", value: stats?.comments ?? 0, icon: <MessageSquare size={14} /> },
                  { label: "Missões", value: stats?.missions ?? 0, icon: <Target size={14} /> },
                ].map((stat) => (
                  <div key={stat.label} className="text-center border border-border p-3">
                    <p className="text-foreground text-lg font-heading font-semibold">{stat.value}</p>
                    <p className="text-muted-foreground text-[.6rem] uppercase tracking-wider font-heading">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <BadgesPanel />
        </>
      )}

      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Current email */}
          <div className="border border-border bg-card p-4 sm:p-6 space-y-4">
            <h3 className="font-heading text-sm tracking-widest uppercase text-foreground">E-mail</h3>
            <div>
              <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">E-mail atual</label>
              <Input value={user?.email || ""} readOnly disabled className="bg-secondary/50 border-border text-muted-foreground text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">Novo e-mail</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo@email.com"
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleUpdateEmail}
              disabled={updatingEmail || !newEmail.trim()}
              className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-8 gap-1"
            >
              {updatingEmail ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Atualizar e-mail
            </Button>
            <p className="text-muted-foreground text-[.6rem] leading-relaxed">
              Um e-mail de confirmação será enviado para o novo endereço.
            </p>
          </div>

          {/* Change password */}
          <div className="border border-border bg-card p-4 sm:p-6 space-y-4">
            <h3 className="font-heading text-sm tracking-widest uppercase text-foreground">Senha</h3>
            <div>
              <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">Nova senha</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-secondary border-border text-foreground text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">Confirmar nova senha</label>
              <Input
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleUpdatePassword}
              disabled={updatingPassword || !newPassword || !confirmPassword}
              className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-8 gap-1"
            >
              {updatingPassword ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Atualizar senha
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePanel;
