import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Mail, Phone, Building2, FileText, Calendar, Clock, Tag, AlertCircle, MessageSquare } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, CHALLENGE_OPTIONS, SOURCE_OPTIONS, type Lead } from "./types";

interface Props {
  lead: Lead;
  onClose: () => void;
}

export default function LeadDetailModal({ lead, onClose }: Props) {
  const { updateLead } = useLeads();
  const [form, setForm] = useState({ ...lead });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "notes" | "activity">("info");

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

  const inputClass = "w-full bg-card border border-border px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors";
  const labelClass = "font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-1.5 block";

  const statusInfo = STATUS_OPTIONS.find((s) => s.key === form.status);

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
          className="bg-card border border-border w-full max-w-[720px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-card z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-primary text-sm font-bold">
                {form.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-mono text-sm text-foreground font-semibold">{form.name}</h3>
                <p className="font-mono text-[10px] text-muted-foreground">{form.company} · {form.cnpj}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save size={12} />
                {saving ? "SALVANDO..." : "SALVAR"}
              </button>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div className="px-6 py-3 border-b border-border flex items-center gap-3 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => update("status", s.key)}
                className={`font-mono text-[9px] tracking-[0.12em] px-3 py-1.5 border transition-all ${
                  form.status === s.key
                    ? `${s.lightBg} ${s.text} ${s.border}`
                    : "border-border text-muted-foreground/50 hover:text-muted-foreground hover:border-border"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-border flex">
            {(["info", "notes", "activity"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`relative font-mono text-[10px] tracking-[0.15em] px-4 py-3 transition-colors ${
                  activeTab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "info" ? "INFORMAÇÕES" : t === "notes" ? "NOTAS" : "ATIVIDADE"}
                {activeTab === t && (
                  <motion.div layoutId="detailTab" className="absolute bottom-0 left-0 w-full h-px bg-primary" />
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
                    <select value={form.source || "website"} onChange={(e) => update("source", e.target.value)} className={inputClass}>
                      {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>DESAFIO</label>
                    <select value={form.challenge || ""} onChange={(e) => update("challenge", e.target.value || null)} className={inputClass}>
                      <option value="">Selecione</option>
                      {CHALLENGE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>PRIORIDADE</label>
                    <select value={form.priority || "medium"} onChange={(e) => update("priority", e.target.value)} className={inputClass}>
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
                  <div className="border border-border px-3 py-2.5 text-sm font-mono text-muted-foreground min-h-[60px] whitespace-pre-wrap">
                    {form.message || "—"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-muted-foreground" />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Criado em {new Date(form.created_at).toLocaleDateString("pt-BR")} às {new Date(form.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-muted-foreground" />
                    <span className="font-mono text-[10px] text-muted-foreground">
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
                <p className="font-mono text-[9px] text-muted-foreground/50">As notas são salvas ao clicar em SALVAR.</p>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="border border-border p-8 flex flex-col items-center justify-center gap-3">
                  <MessageSquare size={24} className="text-muted-foreground/30" />
                  <p className="font-mono text-xs text-muted-foreground">Histórico de atividades em breve.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
