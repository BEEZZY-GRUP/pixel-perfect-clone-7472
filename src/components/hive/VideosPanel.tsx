import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Play, Plus, Save, Trash2, Pencil, Video, Maximize2, MessageCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import VideoTheater from "./VideoTheater";

const VideosPanel = () => {
  const { user } = useAuth();
  const { isAdmin, isModerator } = useIsAdmin();
  const canManageVideos = isAdmin || isModerator;
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", video_url: "", thumbnail_url: "", category: "geral" });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [theaterVideo, setTheaterVideo] = useState<any | null>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const saveVideo = useMutation({
    mutationFn: async (vals: typeof form & { id?: string }) => {
      if (vals.id) {
        const { error } = await supabase.from("videos").update({ title: vals.title, description: vals.description || null, video_url: vals.video_url, thumbnail_url: vals.thumbnail_url || null, category: vals.category }).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("videos").insert({ title: vals.title, description: vals.description || null, video_url: vals.video_url, thumbnail_url: vals.thumbnail_url || null, category: vals.category, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editingId ? "Vídeo atualizado!" : "Vídeo adicionado!"); queryClient.invalidateQueries({ queryKey: ["videos"] }); resetForm(); },
    onError: () => toast.error("Erro ao salvar vídeo."),
  });

  const deleteVideo = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("videos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Vídeo excluído!"); queryClient.invalidateQueries({ queryKey: ["videos"] }); },
    onError: () => toast.error("Erro ao excluir vídeo."),
  });

  const resetForm = () => { setCreating(false); setEditingId(null); setForm({ title: "", description: "", video_url: "", thumbnail_url: "", category: "geral" }); };

  const getEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  const getThumbnail = (url: string, thumbnail?: string | null) => {
    if (thumbnail) return thumbnail;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    return null;
  };

  const categories = ["geral", "marketing", "vendas", "gestão", "execução", "mindset"];

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <Video size={18} className="text-gold shrink-0" />
          <h1 className="font-heading text-base sm:text-lg tracking-wide text-foreground truncate">Vídeos</h1>
        </div>
        {canManageVideos && !creating && (
          <Button onClick={() => setCreating(true)} className="bg-gold text-background hover:bg-gold-light font-heading text-[.55rem] sm:text-[.65rem] tracking-widest uppercase gap-1.5 shrink-0 px-2 sm:px-3 h-8 sm:h-9">
            <Plus size={14} /> <span className="hidden sm:inline">Novo Vídeo</span><span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>

      {(creating || editingId) && canManageVideos && (
        <div className="border border-gold/20 bg-gold/5 p-5 mb-6 space-y-3">
          <p className="text-[.65rem] text-gold uppercase tracking-wider font-heading mb-2">{editingId ? "Editar vídeo" : "Adicionar novo vídeo"}</p>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do vídeo" className="bg-secondary border-border text-foreground text-sm" />
          <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="URL do vídeo (YouTube, Vimeo...)" className="bg-secondary border-border text-foreground text-sm" />
          <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="URL da thumbnail (opcional)" className="bg-secondary border-border text-foreground text-sm" />
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição..." className="bg-secondary border-border text-foreground text-sm min-h-[60px] resize-none" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-secondary border border-border text-foreground text-sm px-3 py-2 font-heading">
            {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveVideo.mutate({ ...form, id: editingId || undefined })} disabled={!form.title || !form.video_url || saveVideo.isPending} className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-8 gap-1"><Save size={12} /> Salvar</Button>
            <Button size="sm" variant="ghost" onClick={resetForm} className="text-muted-foreground text-[.6rem] h-8">Cancelar</Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="border border-border animate-pulse"><div className="aspect-video bg-secondary" /><div className="p-4 space-y-2"><div className="h-4 bg-secondary rounded w-3/4" /><div className="h-3 bg-secondary rounded w-1/2" /></div></div>))}
        </div>
      )}

      {!isLoading && !videos?.length && (
        <div className="border border-border p-12 text-center">
          <Video size={36} className="text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum vídeo publicado ainda.</p>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video: any) => {
            const thumb = getThumbnail(video.video_url, video.thumbnail_url);
            const isPlaying = playingId === video.id;
            return (
              <div key={video.id} className="border border-border bg-card group hover:border-gold/20 transition-colors">
                <div className="aspect-video bg-secondary relative overflow-hidden">
                  {isPlaying ? (
                    <iframe src={getEmbedUrl(video.video_url) + "?autoplay=1"} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                  ) : (
                    <button onClick={() => setPlayingId(video.id)} className="w-full h-full relative">
                      {thumb ? <img src={thumb} alt={video.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video size={40} className="text-muted-foreground/30" /></div>}
                      <div className="absolute inset-0 bg-background/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center"><Play size={22} className="text-background ml-1" /></div>
                      </div>
                    </button>
                  )}
                  {/* Theater mode button */}
                   <button
                    onClick={(e) => { e.stopPropagation(); setPlayingId(null); setTheaterVideo(video); }}
                    className="absolute top-2 right-2 bg-background/70 hover:bg-background/90 text-foreground p-1.5 rounded transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Modo Teatro"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[.55rem] font-heading tracking-wider uppercase text-gold/60 bg-gold/5 px-1.5 py-0.5 inline-block mb-1.5">{video.category}</span>
                      <h3 className="text-foreground text-sm font-medium leading-snug line-clamp-2">{video.title}</h3>
                      {video.description && <p className="text-muted-foreground text-[.7rem] mt-1 line-clamp-2 leading-relaxed">{video.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-muted-foreground/50 text-[.6rem]">{formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: ptBR })}</p>
                        <button
                          onClick={() => setTheaterVideo(video)}
                          className="flex items-center gap-1 text-muted-foreground/50 hover:text-gold text-[.6rem] transition-colors"
                        >
                          <MessageCircle size={10} /> Comentários
                        </button>
                      </div>
                    </div>
                    {canManageVideos && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditingId(video.id); setForm({ title: video.title, description: video.description || "", video_url: video.video_url, thumbnail_url: video.thumbnail_url || "", category: video.category || "geral" }); }} className="text-muted-foreground hover:text-foreground p-1 transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => { if (confirm("Excluir este vídeo?")) deleteVideo.mutate(video.id); }} className="text-destructive/50 hover:text-destructive p-1 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Theater Mode */}
      <AnimatePresence>
        {theaterVideo && (
          <VideoTheater
            video={theaterVideo}
            embedUrl={getEmbedUrl(theaterVideo.video_url)}
            onClose={() => setTheaterVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideosPanel;
