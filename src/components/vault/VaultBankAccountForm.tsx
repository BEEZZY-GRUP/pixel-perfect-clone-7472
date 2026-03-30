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
  account?: any;
}

const VaultBankAccountForm = ({ open, onClose, companyId, account }: Props) => {
  const qc = useQueryClient();
  const isEdit = !!account;
  const [form, setForm] = useState({
    bank_name: account?.bank_name ?? "",
    agency: account?.agency ?? "",
    account_number: account?.account_number ?? "",
    account_type: account?.account_type ?? "Corrente",
    balance: account?.balance?.toString() ?? "0",
    credit_limit: account?.credit_limit?.toString() ?? "0",
    active: account?.active ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.bank_name) { toast.error("Nome do banco é obrigatório"); return; }
    setLoading(true);
    const payload = {
      company_id: companyId,
      bank_name: form.bank_name,
      agency: form.agency || null,
      account_number: form.account_number || null,
      account_type: form.account_type,
      balance: Number(form.balance) || 0,
      credit_limit: Number(form.credit_limit) || 0,
      active: form.active,
    };
    const { error } = isEdit
      ? await supabase.from("vault_bank_accounts").update(payload).eq("id", account.id)
      : await supabase.from("vault_bank_accounts").insert(payload);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Conta atualizada" : "Conta criada");
    qc.invalidateQueries({ queryKey: ["vault_bank_accounts"] });
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
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {field("Banco", "bank_name")}
          <div className="grid grid-cols-2 gap-3">
            {field("Agência", "agency")}
            {field("Nº Conta", "account_number")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Tipo", "account_type", "text", ["Corrente", "Poupança", "Investimento", "Digital"])}
            {field("Saldo (R$)", "balance", "number")}
          </div>
          {field("Limite de Crédito (R$)", "credit_limit", "number")}
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

export default VaultBankAccountForm;
