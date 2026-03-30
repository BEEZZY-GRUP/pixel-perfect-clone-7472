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
    if (!form.bank_name.trim()) { toast.error("Informe o nome do banco"); return; }
    setLoading(true);
    const payload = {
      company_id: companyId,
      bank_name: form.bank_name.trim(),
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
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {inputField("Banco", "bank_name", "text", "Ex: Nubank, Itaú, Bradesco...")}
          <div className="grid grid-cols-2 gap-3">
            {inputField("Agência", "agency", "text", "0000")}
            {inputField("Nº Conta", "account_number", "text", "00000-0")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Tipo</label>
              <select
                value={form.account_type}
                onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none"
              >
                {["Corrente", "Poupança", "Investimento", "Digital", "Salário"].map(o => (
                  <option key={o} value={o} className="bg-[#111]">{o}</option>
                ))}
              </select>
            </div>
            {inputField("Saldo (R$)", "balance", "number", "0,00")}
          </div>
          {inputField("Limite de Crédito (R$)", "credit_limit", "number", "0,00")}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="accent-[#FFD600]"
            />
            Conta ativa
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

export default VaultBankAccountForm;
