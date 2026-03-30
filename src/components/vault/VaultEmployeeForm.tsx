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
  employee?: any;
}

const VaultEmployeeForm = ({ open, onClose, companyId, employee }: Props) => {
  const qc = useQueryClient();
  const isEdit = !!employee;
  const [form, setForm] = useState({
    name: employee?.name ?? "",
    position: employee?.position ?? "",
    department: employee?.department ?? "",
    employment_type: employee?.employment_type ?? "CLT",
    salary: employee?.salary?.toString() ?? "",
    admission_date: employee?.admission_date ?? "",
    status: employee?.status ?? "ativo",
    email: employee?.email ?? "",
    cpf: employee?.cpf ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    setLoading(true);
    const payload = {
      company_id: companyId,
      name: form.name,
      position: form.position || null,
      department: form.department || null,
      employment_type: form.employment_type,
      salary: Number(form.salary) || 0,
      admission_date: form.admission_date || null,
      status: form.status,
      email: form.email || null,
      cpf: form.cpf || null,
    };
    const { error } = isEdit
      ? await supabase.from("vault_employees").update(payload).eq("id", employee.id)
      : await supabase.from("vault_employees").insert(payload);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? "Colaborador atualizado" : "Colaborador adicionado");
    qc.invalidateQueries({ queryKey: ["vault_employees"] });
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
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("Nome", "name")}
            {field("CPF", "cpf")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Cargo", "position")}
            {field("Departamento", "department")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Tipo", "employment_type", "text", ["CLT", "PJ", "Estágio"])}
            {field("Salário (R$)", "salary", "number")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Admissão", "admission_date", "date")}
            {field("Status", "status", "text", ["ativo", "inativo", "ferias"])}
          </div>
          {field("Email", "email", "email")}
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

export default VaultEmployeeForm;
