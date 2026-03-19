import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import BadgesPanel from "./BadgesPanel";
import UserAvatar from "./UserAvatar";
import OnboardingTutorial from "./OnboardingTutorial";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Save, X, Camera, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

const ProfilePanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(searchParams.get("onboarding") === "true");
  const [editValues, setEditValues] = useState({
    company_name: "",
    bio: "",
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, companies(cnpj)")
        .eq("user_id", user!.id)
        .single();
      return data;
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
    mutationFn: async (vals: { company_name: string; bio: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: vals.company_name,
          bio: vals.bio || null,
        })
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

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);
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
    setEditValues({
      company_name: profile.company_name,
      bio: profile.bio || "",
      cnpj: profile.cnpj || "",
    });
    setEditing(true);
  };

  if (!profile) return null;

  const currentLevelXp = ((profile.level - 1) ** 2) * 100;
  const nextLevelXp = (profile.level ** 2) * 100;
  const progressPercent = nextLevelXp > currentLevelXp
    ? ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Remove query param
    searchParams.delete("onboarding");
    setSearchParams(searchParams, { replace: true });
    // Auto-open edit mode
    startEditing();
  };

  return (
    <div className="space-y-8">
      {showOnboarding && <OnboardingTutorial onComplete={handleOnboardingComplete} />}

      {/* Profile header */}
      <div className="border border-border bg-card">
        {/* Cover gradient */}
        <div className="h-20 bg-gradient-to-br from-gold/20 via-gold/5 to-transparent" />

        <div className="px-6 pb-6 -mt-10">
          {/* Avatar + edit button */}
          <div className="flex items-end justify-between mb-4">
            <div className="relative group" data-onboarding="avatar">
              <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-secondary">
                <UserAvatar
                  avatarUrl={profile.avatar_url}
                  name={profile.company_name}
                  size="lg"
                  className="w-full h-full text-lg"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading ? (
                  <Loader2 size={18} className="text-gold animate-spin" />
                ) : (
                  <Camera size={18} className="text-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {!editing && (
              <Button
                data-onboarding="edit"
                size="sm"
                variant="ghost"
                onClick={startEditing}
                className="text-muted-foreground hover:text-foreground text-[.6rem] tracking-wider uppercase font-heading h-7 gap-1"
              >
                <Pencil size={12} />
                Editar perfil
              </Button>
            )}
          </div>

          {/* Editable info */}
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">
                  Nome / Empresa
                </label>
                <Input
                  value={editValues.company_name}
                  onChange={(e) => setEditValues({ ...editValues, company_name: e.target.value })}
                  className="bg-secondary border-border text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">
                  CNPJ
                </label>
                <Input
                  value={editValues.cnpj}
                  onChange={(e) => setEditValues({ ...editValues, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="bg-secondary border-border text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-[.6rem] text-muted-foreground uppercase tracking-wider font-heading mb-1 block">
                  Bio
                </label>
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
                  <Save size={12} />
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  className="text-muted-foreground text-[.6rem] h-8 gap-1"
                >
                  <X size={12} />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-foreground text-lg font-medium">{profile.company_name}</h2>
              {profile.cnpj && (
                <p className="text-muted-foreground text-xs mt-0.5">{profile.cnpj}</p>
              )}
              {profile.bio && (
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{profile.bio}</p>
              )}
            </>
          )}

          {/* Level & XP */}
          <div className="bg-secondary/50 border border-border p-4 mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground text-sm font-heading">
                Nível {profile.level}
              </span>
              <span className="text-gold text-sm font-heading font-semibold">
                {profile.xp} XP
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <p className="text-muted-foreground text-[.6rem] mt-1 text-right">
              {nextLevelXp - profile.xp} XP para o nível {profile.level + 1}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Posts", value: stats?.posts ?? 0 },
              { label: "Comentários", value: stats?.comments ?? 0 },
              { label: "Missões", value: stats?.missions ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="text-center border border-border p-3">
                <p className="text-foreground text-lg font-heading font-semibold">{stat.value}</p>
                <p className="text-muted-foreground text-[.6rem] uppercase tracking-wider font-heading">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      <BadgesPanel />
    </div>
  );
};

export default ProfilePanel;
