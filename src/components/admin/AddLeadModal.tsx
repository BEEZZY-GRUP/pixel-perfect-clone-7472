import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { useLeads } from "./LeadsContext";
import { CHALLENGE_OPTIONS, PRIORITY_OPTIONS, SOURCE_OPTIONS } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddLeadModal({ open, onClose }: Props) {
  const { addLead } = useLeads();
  const [form, setForm] = useState({
    name: "", email: "", company: "", cnpj: "", phone: "",
    message: "", challenge: "", source: "manual", priority: "medium",
    status: "novo", notes: "", tags: [] as string[],
    last_contact_at: null as string | null,
  });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company || !form.cnpj) return;
    setSaving(true);
    await addLead({
      name: form.name,
      email: form.email,
      company: form.company,
      cnpj: form.cnpj,
      phone: form.phone || null,
      message: form.message || null,
      challenge: form.challenge || null,
      source: form.source,
      priority: form.priority,
      status: form.status,
      notes: form.notes || null,
      tags: form.tags,
      last_contact_at: form.last_contact_at,
    });
    setSaving(false);
    setForm({ name: "", email: "", company: "", cnpj: "", phone: "", message: "", challenge: "", source: "manual", priority: "medium", status: "novo", notes: "", tags: [], last_contact_at: null });
    onClose();
  };

  const inputClass = "w-full bg-card border border-border px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors";
  const labelClass = "font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-1.5 block";

  if (!open) return null;

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
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-card border border-border w-full max-w-[580px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus size={16} className="text-primary" />
              <h3 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">NOVO LEAD</h3>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>NOME *</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} placeholder="João Silva" required />
              </div>
              <div>
                <label className={labelClass}>E-MAIL *</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} placeholder="joao@empresa.com" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>EMPRESA *</label>
                <input value={form.company} onChange={(e) => update("company", e.target.value)} className={inputClass} placeholder="Minha Empresa" required />
              </div>
              <div>
                <label className={labelClass}>CNPJ *</label>
                <input value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} className={inputClass} placeholder="00.000.000/0000-00" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>TELEFONE</label>
                <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className={labelClass}>ORIGEM</label>
                <select value={form.source} onChange={(e) => update("source", e.target.value)} className={inputClass}>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>DESAFIO</label>
                <select value={form.challenge} onChange={(e) => update("challenge", e.target.value)} className={inputClass}>
                  <option value="">Selecione</option>
                  {CHALLENGE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>PRIORIDADE</label>
                <select value={form.priority} onChange={(e) => update("priority", e.target.value)} className={inputClass}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.emoji} {p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>NOTAS</label>
              <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Observações internas..." />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.15em] px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              {saving ? "CRIANDO..." : "CRIAR LEAD"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
