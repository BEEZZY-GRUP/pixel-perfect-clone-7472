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
  bankAccounts: any[];
  transaction?: any;
}

const VaultTransactionForm = ({ open, onClose, companyId, bankAccounts, transaction }: Props) => {
  const qc = useQueryClient();
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    description: transaction?.description ?? "",
    transaction_type: transaction?.transaction_type ?? "despesa",
    amount: transaction?.amount?.toString() ?? "",
    transaction_date: transaction?.transaction_date ?? new Date().toISOString().split("T")[0],
    bank_account_id: transaction?.bank_account_id ?? "",
    category: transaction?.category ?? "",
    reconciled: transaction?.reconciled ?? false,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.description || !form.amount) { toast.error("Preencha descrição e valor"); return; }
    setLoading(true);
    const payload = {
      company_id: companyId,
      description: form.description,
      transaction_type: form.transaction_type,
      amount: Number(form.amount),
      transaction_date: form.transaction_date,
      bank_account_id: form.bank_account_id || null,
      category: form.category || null,
      reconciled: form.reconciled,
    };
    const { error } = isEdit
      ? await supabase.from("vault_bank_transactions").update(payload).eq("id", transaction.id)
      : await supabase.from("vault_bank_transactions").insert(payload);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Transação atualizada" : "Transação criada");
    qc.invalidateQueries({ queryKey: ["vault_bank_transactions"] });
    onClose();
  };

  const field = (label: string, key: string, type = "text", options?: { value: string; label: string }[]) => (
    <div>
      <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>{label}</label>
      {options ? (
        <select
          value={(form as any)[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none"
        >
          {options.map(o => <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>)}
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
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {field("Descrição", "description")}
          <div className="grid grid-cols-2 gap-3">
            {field("Tipo", "transaction_type", "text", [
              { value: "receita", label: "Receita" },
              { value: "despesa", label: "Despesa" },
              { value: "transferencia", label: "Transferência" },
            ])}
            {field("Valor (R$)", "amount", "number")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Data", "transaction_date", "date")}
            {field("Conta", "bank_account_id", "text", [
              { value: "", label: "Selecione..." },
              ...bankAccounts.map((a: any) => ({ value: a.id, label: `${a.bank_name} - ${a.account_number || "S/N"}` })),
            ])}
          </div>
          {field("Categoria", "category")}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={form.reconciled}
              onChange={e => setForm(f => ({ ...f, reconciled: e.target.checked }))}
              className="accent-[#FFD600]"
            />
            Conciliado
          </label>
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

export default VaultTransactionForm;
