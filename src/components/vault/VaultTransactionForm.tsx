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
  bankAccounts: any[];
  transaction?: any;
}

const TRANSACTION_CATEGORIES = [
  "Vendas", "Serviços", "Fornecedores", "Salários", "Impostos",
  "Aluguel", "Marketing", "Transferência Interna", "Empréstimo",
  "Investimento", "Dividendos", "Outros",
];

const initCurrency = (v: any) => {
  const n = Number(v);
  if (!v || n === 0) return "";
  return maskCurrency(n.toFixed(2).replace(".", ","));
};

const VaultTransactionForm = ({ open, onClose, companyId, bankAccounts, transaction }: Props) => {
  const qc = useQueryClient();
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    description: transaction?.description ?? "",
    transaction_type: transaction?.transaction_type ?? "despesa",
    amount: initCurrency(transaction?.amount),
    transaction_date: transaction?.transaction_date ?? new Date().toISOString().split("T")[0],
    bank_account_id: transaction?.bank_account_id ?? "",
    category: transaction?.category ?? "",
    reconciled: transaction?.reconciled ?? false,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.description) { toast.error("Preencha a descrição"); return; }
    const numAmount = Number(unmaskCurrency(form.amount));
    if (!numAmount || numAmount <= 0) { toast.error("Informe um valor válido"); return; }
    if (!form.bank_account_id) { toast.error("Selecione uma conta bancária"); return; }
    if (!form.category) { toast.error("Selecione uma categoria"); return; }
    setLoading(true);
    const payload = {
      company_id: companyId,
      description: form.description,
      transaction_type: form.transaction_type,
      amount: numAmount,
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

  const cls = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none placeholder:text-white/20";

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Descrição</label>
            <input type="text" placeholder="Ex: Pagamento fornecedor" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={cls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {selectField("Tipo", "transaction_type", [
              { value: "receita", label: "Receita" },
              { value: "despesa", label: "Despesa" },
              { value: "transferencia", label: "Transferência" },
            ])}
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Valor</label>
              <input type="text" inputMode="decimal" placeholder="R$ 0,00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: maskCurrency(e.target.value) }))} className={cls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Data</label>
              <input type="date" value={form.transaction_date}
                onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} className={cls} />
            </div>
            {selectField("Conta", "bank_account_id", bankAccounts.map((a: any) => ({
              value: a.id,
              label: `${a.bank_name} - ${a.account_number || "S/N"}`,
            })), "Selecione a conta...")}
          </div>
          {selectField("Categoria", "category", TRANSACTION_CATEGORIES.map(c => ({ value: c, label: c })), "Selecione...")}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={form.reconciled} onChange={e => setForm(f => ({ ...f, reconciled: e.target.checked }))} className="accent-[#FFD600]" />
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
