import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  entry?: any;
}

const VaultEntryForm = ({ open, onClose, companyId, entry }: Props) => {
  const qc = useQueryClient();
  const isEdit = !!entry;
  const [form, setForm] = useState({
    description: entry?.description ?? "",
    entry_type: entry?.entry_type ?? "despesa",
    category: entry?.category ?? "",
    amount: entry?.amount?.toString() ?? "",
    due_date: entry?.due_date ?? "",
    status: entry?.status ?? "pendente",
    notes: entry?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      toast.error("Preencha descrição e valor");
      return;
    }
    setLoading(true);
    const payload = {
      company_id: companyId,
      description: form.description,
      entry_type: form.entry_type,
      category: form.category || null,
      amount: Number(form.amount),
      due_date: form.due_date || null,
      status: form.status,
      notes: form.notes || null,
    };
    const { error } = isEdit
      ? await supabase.from("vault_entries").update(payload).eq("id", entry.id)
      : await supabase.from("vault_entries").insert(payload);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Lançamento atualizado" : "Lançamento criado");
    qc.invalidateQueries({ queryKey: ["vault_entries"] });
    onClose();
  };

  const field = (label: string, key: string, type = "text", options?: string[]) => (
    <div>
      <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>{label}</label>
      {options ? (
        <select
          value={(form as any)[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none"
        >
          {options.map(o => <option key={o} value={o} className="bg-[#111]">{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(form as any)[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none"
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {field("Descrição", "description")}
          <div className="grid grid-cols-2 gap-3">
            {field("Tipo", "entry_type", "text", ["faturamento", "despesa"])}
            {field("Categoria", "category")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Valor (R$)", "amount", "number")}
            {field("Vencimento", "due_date", "date")}
          </div>
          {field("Status", "status", "text", ["pendente", "pago", "vencido"])}
          {field("Observações", "notes")}
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="ghost" onClick={onClose} className="text-[#F2F0E8]/60">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[#FFD600] text-black hover:bg-[#E6C200]">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VaultEntryForm;
