import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { maskCurrency, unmaskCurrency } from "@/lib/masks";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  entry?: any;
  defaultType?: "despesa" | "faturamento";
}

const CATEGORIES_DESPESA = [
  "Aluguel", "Salários", "Impostos", "Marketing", "Fornecedores", "Energia",
  "Água", "Internet/Telecom", "Contabilidade", "Jurídico", "Transporte",
  "Material de Escritório", "Software/Assinatura", "Manutenção", "Seguros",
  "Alimentação", "Outros",
];

const CATEGORIES_FATURAMENTO = [
  "Serviços", "Produtos", "Consultoria", "Licenciamento", "Comissões",
  "Recorrência/Assinatura", "Projeto", "Outros",
];

const PAYMENT_METHODS = [
  "Pix", "Boleto", "Cartão de Crédito", "Cartão de Débito", "Transferência",
  "Dinheiro", "Cheque", "Débito Automático",
];

const initCurrency = (v: any) => {
  const n = Number(v);
  if (!v || n === 0) return "";
  return maskCurrency(n.toFixed(2).replace(".", ","));
};

const VaultEntryForm = ({ open, onClose, companyId, entry, defaultType }: Props) => {
  const qc = useQueryClient();
  const isEdit = !!entry;
  const [form, setForm] = useState({
    description: entry?.description ?? "",
    entry_type: entry?.entry_type ?? defaultType ?? "despesa",
    category: entry?.category ?? "",
    amount: initCurrency(entry?.amount),
    due_date: entry?.due_date ?? "",
    entry_date: entry?.entry_date ?? new Date().toISOString().split("T")[0],
    status: entry?.status ?? "pendente",
    payment_method: entry?.payment_method ?? "",
    notes: entry?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);

  const categories = form.entry_type === "faturamento" ? CATEGORIES_FATURAMENTO : CATEGORIES_DESPESA;

  const handleSave = async () => {
    if (!form.description) { toast.error("Preencha a descrição"); return; }
    const numAmount = Number(unmaskCurrency(form.amount));
    if (!numAmount || numAmount <= 0) { toast.error("Informe um valor válido"); return; }
    if (!form.category) { toast.error("Selecione uma categoria"); return; }
    setLoading(true);
    const payload = {
      company_id: companyId,
      description: form.description,
      entry_type: form.entry_type,
      category: form.category || null,
      amount: numAmount,
      due_date: form.due_date || null,
      entry_date: form.entry_date || null,
      status: form.status,
      payment_method: form.payment_method || null,
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

  const selectField = (label: string, key: string, options: { value: string; label: string }[], placeholder?: string) => (
    <div>
      <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>{label}</label>
      <select
        value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none"
      >
        {placeholder && <option value="" className="bg-[#111]">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>)}
      </select>
    </div>
  );

  const inputField = (label: string, key: string, type = "text", placeholder?: string) => (
    <div>
      <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none placeholder:text-white/20"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {inputField("Descrição", "description", "text", "Ex: Pagamento fornecedor X")}
          <div className="grid grid-cols-2 gap-3">
            {selectField("Tipo", "entry_type", [
              { value: "despesa", label: "Despesa" },
              { value: "faturamento", label: "Faturamento" },
            ])}
            {selectField("Categoria", "category", categories.map(c => ({ value: c, label: c })), "Selecione...")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Valor</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: maskCurrency(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none placeholder:text-white/20"
              />
            </div>
            {inputField("Vencimento", "due_date", "date")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inputField("Data Lançamento", "entry_date", "date")}
            {selectField("Forma de Pagamento", "payment_method", PAYMENT_METHODS.map(m => ({ value: m, label: m })), "Selecione...")}
          </div>
          {selectField("Status", "status", [
            { value: "pendente", label: "Pendente" },
            { value: "pago", label: "Pago" },
            { value: "vencido", label: "Vencido" },
          ])}
          {inputField("Observações", "notes", "text", "Notas adicionais...")}
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
