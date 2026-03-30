import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { maskAgency, maskAccountNumber, maskCurrency, unmaskCurrency } from "@/lib/masks";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  account?: any;
}

const initCurrency = (v: any) => {
  const n = Number(v);
  if (!v || n === 0) return "";
  return maskCurrency(n.toFixed(2).replace(".", ","));
};

const VaultBankAccountForm = ({ open, onClose, companyId, account }: Props) => {
  const qc = useQueryClient();
  const isEdit = !!account;
  const [form, setForm] = useState({
    bank_name: account?.bank_name ?? "",
    agency: account?.agency ?? "",
    account_number: account?.account_number ?? "",
    account_type: account?.account_type ?? "Corrente",
    balance: initCurrency(account?.balance),
    credit_limit: initCurrency(account?.credit_limit),
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
      balance: Number(unmaskCurrency(form.balance)) || 0,
      credit_limit: Number(unmaskCurrency(form.credit_limit)) || 0,
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

  const cls = "w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none placeholder:text-white/20";

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#111] border-white/10 text-[#F2F0E8] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Conta" : "Nova Conta Bancária"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Banco</label>
            <input type="text" placeholder="Ex: Nubank, Itaú, Bradesco..." value={form.bank_name}
              onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className={cls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Agência</label>
              <input type="text" inputMode="numeric" placeholder="0000-0" value={form.agency}
                onChange={e => setForm(f => ({ ...f, agency: maskAgency(e.target.value) }))} className={cls} maxLength={6} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Nº Conta</label>
              <input type="text" inputMode="numeric" placeholder="00000-0" value={form.account_number}
                onChange={e => setForm(f => ({ ...f, account_number: maskAccountNumber(e.target.value) }))} className={cls} maxLength={15} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Tipo</label>
              <select value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-[#F2F0E8] focus:border-[#FFD600]/50 outline-none">
                {["Corrente", "Poupança", "Investimento", "Digital", "Salário"].map(o => (
                  <option key={o} value={o} className="bg-[#111]">{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Saldo</label>
              <input type="text" inputMode="decimal" placeholder="R$ 0,00" value={form.balance}
                onChange={e => setForm(f => ({ ...f, balance: maskCurrency(e.target.value) }))} className={cls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(242,240,232,0.4)" }}>Limite de Crédito</label>
            <input type="text" inputMode="decimal" placeholder="R$ 0,00" value={form.credit_limit}
              onChange={e => setForm(f => ({ ...f, credit_limit: maskCurrency(e.target.value) }))} className={cls} />
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="accent-[#FFD600]" />
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
