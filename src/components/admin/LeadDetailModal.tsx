import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Mail, Phone, Building2, FileText, Calendar, Clock, Tag, AlertCircle, MessageSquare, Plus, PhoneCall, Video, Send, CheckCircle, Trash2, ArrowRight, Bot, Edit, Stethoscope, StickyNote } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, CHALLENGE_OPTIONS, SOURCE_OPTIONS, type Lead } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Activity {
  id: string;
  lead_id: string;
  created_at: string;
  activity_type: string;
  description: string;
  scheduled_at: string | null;
  is_automatic: boolean;
}

const ACTIVITY_TYPES = [
  { key: "nota", label: "Nota", icon: StickyNote, color: "text-muted-foreground" },
  { key: "ligacao", label: "Ligação", icon: PhoneCall, color: "text-blue-400" },
  { key: "reuniao", label: "Reunião", icon: Video, color: "text-purple-400" },
  { key: "email", label: "E-mail", icon: Send, color: "text-green-400" },
  { key: "tarefa", label: "Tarefa", icon: CheckCircle, color: "text-gold" },
  { key: "movimentacao", label: "Movimentação", icon: ArrowRight, color: "text-orange-400" },
  { key: "edicao", label: "Edição", icon: Edit, color: "text-cyan-400" },
  { key: "diagnostico", label: "Diagnóstico", icon: Stethoscope, color: "text-emerald-400" },
];

interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
}

interface Props {
  lead: Lead;
  onClose: () => void;
}

export default function LeadDetailModal({ lead, onClose }: Props) {
  const { updateLead } = useLeads();
  const [form, setForm] = useState({ ...lead });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "notes" | "activity">("info");

  // Activity state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({ activity_type: "nota", description: "", scheduled_at: "" });
  const [savingActivity, setSavingActivity] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const update = (field: keyof Lead, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await updateLead(lead.id, {
      name: form.name,
      email: form.email,
      company: form.company,
      cnpj: form.cnpj,
      phone: form.phone,
      message: form.message,
      challenge: form.challenge,
      notes: form.notes,
      source: form.source,
      status: form.status,
      priority: form.priority,
      tags: form.tags,
      last_contact_at: form.last_contact_at,
    });
    setSaving(false);
    onClose();
  };

  // Load activities
  const loadActivities = async () => {
    setLoadingActivities(true);
    const { data } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    setActivities((data as unknown as Activity[]) || []);
    setLoadingActivities(false);
  };

  const loadNotes = async () => {
    setLoadingNotes(true);
    const { data } = await supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    setNotes((data as unknown as LeadNote[]) || []);
    setLoadingNotes(false);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) { toast.error("Escreva a nota"); return; }
    setSavingNote(true);
    const { error } = await supabase.from("lead_notes").insert({ lead_id: lead.id, content: newNoteContent } as any);
    setSavingNote(false);
    if (error) { toast.error("Erro ao salvar nota"); return; }
    toast.success("Nota adicionada!");
    setNewNoteContent("");
    setShowAddNote(false);
    loadNotes();
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from("lead_notes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir nota"); return; }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (activeTab === "activity") loadActivities();
    if (activeTab === "notes") loadNotes();
  }, [activeTab]);

  const handleAddActivity = async () => {
    if (!newActivity.description.trim()) {
      toast.error("Adicione uma descrição");
      return;
    }
    setSavingActivity(true);
    const payload: any = {
      lead_id: lead.id,
      activity_type: newActivity.activity_type,
      description: newActivity.description,
    };
    if (newActivity.scheduled_at) payload.scheduled_at = new Date(newActivity.scheduled_at).toISOString();
    const { error } = await supabase.from("lead_activities").insert(payload);
    setSavingActivity(false);
    if (error) {
      toast.error("Erro ao salvar atividade");
      return;
    }
    toast.success("Atividade adicionada!");
    setNewActivity({ activity_type: "nota", description: "", scheduled_at: "" });
    setShowAddActivity(false);
    loadActivities();
  };

  const handleDeleteActivity = async (id: string) => {
    const { error } = await supabase.from("lead_activities").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const inputClass = "w-full bg-card/20 border border-border/40 rounded-lg px-3 py-2.5 text-sm font-heading text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-gold-border transition-colors";
  const labelClass = "font-heading text-[10px] tracking-[0.15em] text-muted-foreground/70 mb-1.5 block font-semibold";

  const statusInfo = STATUS_OPTIONS.find((s) => s.key === form.status);

  const getActivityIcon = (type: string) => {
    const t = ACTIVITY_TYPES.find((a) => a.key === type);
    if (!t) return { Icon: FileText, color: "text-muted-foreground", label: type };
    return { Icon: t.icon, color: t.color, label: t.label };
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-background border border-border/50 rounded-lg w-full max-w-[720px] max-h-[90vh] overflow-y-auto scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold-border/30 flex items-center justify-center font-heading text-gold text-sm font-bold">
                {form.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-heading text-sm text-foreground font-semibold">{form.name}</h3>
                <p className="font-heading text-[10px] text-muted-foreground/60">{form.company} · {form.cnpj}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-2 bg-gold/90 text-background hover:bg-gold transition-colors rounded-lg disabled:opacity-50 font-bold"
              >
                <Save size={12} />
                {saving ? "SALVANDO..." : "SALVAR"}
              </button>
              <button onClick={onClose} className="p-2 text-muted-foreground/50 hover:text-foreground transition-colors rounded-lg">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div className="px-6 py-3 border-b border-border/30 flex items-center gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => update("status", s.key)}
                className={`font-heading text-[9px] tracking-[0.12em] px-3 py-1.5 rounded-md border transition-all ${
                  form.status === s.key
                    ? `${s.lightBg} ${s.text} ${s.border}`
                    : "border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60 hover:border-border/50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-border/30 flex">
            {(["info", "notes", "activity"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`relative font-heading text-[10px] tracking-[0.15em] px-4 py-3 transition-colors font-semibold ${
                  activeTab === t ? "text-gold" : "text-muted-foreground/50 hover:text-foreground/70"
                }`}
              >
                {t === "info" ? "INFORMAÇÕES" : t === "notes" ? "NOTAS" : "ATIVIDADE"}
                {activeTab === t && (
                  <motion.div layoutId="detailTab" className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gold" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "info" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>NOME</label>
                    <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>E-MAIL</label>
                    <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>EMPRESA</label>
                    <input value={form.company} onChange={(e) => update("company", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>CNPJ</label>
                    <input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>TELEFONE</label>
                    <input value={form.phone || ""} onChange={(e) => update("phone", e.target.value || null)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>ORIGEM</label>
                    <select value={form.source || "website"} onChange={(e) => update("source", e.target.value)} className={inputClass + " appearance-none cursor-pointer"}>
                      {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>DESAFIO</label>
                    <select value={form.challenge || ""} onChange={(e) => update("challenge", e.target.value || null)} className={inputClass + " appearance-none cursor-pointer"}>
                      <option value="">Selecione</option>
                      {CHALLENGE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>PRIORIDADE</label>
                    <select value={form.priority || "medium"} onChange={(e) => update("priority", e.target.value)} className={inputClass + " appearance-none cursor-pointer"}>
                      {PRIORITY_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>ÚLTIMO CONTATO</label>
                  <input
                    type="datetime-local"
                    value={form.last_contact_at ? form.last_contact_at.slice(0, 16) : ""}
                    onChange={(e) => update("last_contact_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>MENSAGEM ORIGINAL</label>
                  <div className="border border-border/30 rounded-lg px-3 py-2.5 text-sm font-heading text-muted-foreground/60 min-h-[60px] whitespace-pre-wrap bg-card/10">
                    {form.message || "—"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-muted-foreground/40" />
                    <span className="font-heading text-[10px] text-muted-foreground/50">
                      Criado em {new Date(form.created_at).toLocaleDateString("pt-BR")} às {new Date(form.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-muted-foreground/40" />
                    <span className="font-heading text-[10px] text-muted-foreground/50">
                      Atualizado em {new Date(form.updated_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <label className={labelClass}>NOTAS INTERNAS</label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => update("notes", e.target.value || null)}
                  placeholder="Adicione observações sobre este lead..."
                  className={`${inputClass} min-h-[200px] resize-y`}
                />
                <p className="font-heading text-[9px] text-muted-foreground/40">As notas são salvas ao clicar em SALVAR.</p>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                {/* Add activity button / form */}
                {!showAddActivity ? (
                  <button
                    onClick={() => setShowAddActivity(true)}
                    className="w-full flex items-center justify-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-3 border border-dashed border-gold-border/40 text-gold/70 hover:text-gold hover:border-gold-border hover:bg-gold-dim/30 transition-all rounded-lg font-semibold"
                  >
                    <Plus size={14} /> ADICIONAR ATIVIDADE
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-gold-border/40 bg-gold-dim/10 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-heading text-[10px] tracking-[0.15em] text-gold font-semibold">NOVA ATIVIDADE</p>
                      <button onClick={() => setShowAddActivity(false)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                        <X size={14} />
                      </button>
                    </div>

                    {/* Type selector */}
                    <div className="flex gap-1.5 flex-wrap">
                      {ACTIVITY_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSelected = newActivity.activity_type === t.key;
                        return (
                          <button
                            key={t.key}
                            onClick={() => setNewActivity((a) => ({ ...a, activity_type: t.key }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-heading text-[10px] font-semibold transition-all border ${
                              isSelected
                                ? "border-gold-border bg-gold/10 text-gold"
                                : "border-border/30 text-muted-foreground/50 hover:border-border/50"
                            }`}
                          >
                            <Icon size={11} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Description */}
                    <textarea
                      value={newActivity.description}
                      onChange={(e) => setNewActivity((a) => ({ ...a, description: e.target.value }))}
                      placeholder="Descreva a atividade..."
                      className={`${inputClass} min-h-[80px] resize-y`}
                    />

                    {/* Scheduled date (optional) */}
                    <div>
                      <label className={labelClass}>AGENDADO PARA (opcional)</label>
                      <input
                        type="datetime-local"
                        value={newActivity.scheduled_at}
                        onChange={(e) => setNewActivity((a) => ({ ...a, scheduled_at: e.target.value }))}
                        className={inputClass}
                      />
                    </div>

                    {/* Save */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddActivity}
                        disabled={savingActivity}
                        className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-2 bg-gold/90 text-background hover:bg-gold transition-all rounded-lg font-bold disabled:opacity-50"
                      >
                        <Plus size={12} /> {savingActivity ? "SALVANDO..." : "ADICIONAR"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Activities list */}
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="border border-border/30 rounded-lg p-8 flex flex-col items-center justify-center gap-3">
                    <MessageSquare size={24} className="text-muted-foreground/20" />
                    <p className="font-heading text-xs text-muted-foreground/40">Nenhuma atividade registrada.</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {activities.map((activity, i) => {
                      const { Icon, color, label } = getActivityIcon(activity.activity_type);
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex gap-3 group"
                        >
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full border border-border/40 bg-card/20 flex items-center justify-center shrink-0 ${color}`}>
                              <Icon size={13} />
                            </div>
                            {i < activities.length - 1 && (
                              <div className="w-px flex-1 bg-border/20 my-1" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`font-heading text-[10px] font-semibold ${color}`}>{label}</span>
                                {(activity as any).is_automatic && (
                                  <span className="inline-flex items-center gap-0.5 font-heading text-[8px] text-muted-foreground/40 bg-card/30 px-1.5 py-0.5 rounded border border-border/20">
                                    <Bot size={8} /> AUTO
                                  </span>
                                )}
                                <span className="font-heading text-[9px] text-muted-foreground/40">{timeAgo(activity.created_at)}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteActivity(activity.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground/30 hover:text-red-400"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <p className="font-heading text-xs text-foreground/80 mt-1 whitespace-pre-wrap">{activity.description}</p>
                            {activity.scheduled_at && (
                              <span className="inline-flex items-center gap-1 font-heading text-[9px] text-gold/60 mt-1.5 bg-gold-dim px-2 py-0.5 rounded">
                                <Clock size={9} />
                                {new Date(activity.scheduled_at).toLocaleDateString("pt-BR")} às {new Date(activity.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
