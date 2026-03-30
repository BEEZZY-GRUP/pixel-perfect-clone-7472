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

const DEPARTMENTS = [
  "Administrativo", "Comercial", "Financeiro", "Marketing", "Operações",
  "RH", "TI", "Jurídico", "Logística", "Atendimento", "Diretoria", "Outros",
];

const POSITIONS = [
  "Analista", "Assistente", "Auxiliar", "Coordenador", "Diretor", "Estagiário",
  "Gerente", "Líder", "Sócio", "Supervisor", "Técnico", "Consultor", "Outros",
];

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
    pis: employee?.pis ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    if (!form.department) { toast.error("Selecione um departamento"); return; }
    if (!form.position) { toast.error("Selecione um cargo"); return; }
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
      pis: form.pis || null,
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
          <DialogTitle className="text-[#F2F0E8]">{isEdit ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {inputField("Nome", "name", "text", "Nome completo")}
            {inputField("CPF", "cpf", "text", "000.000.000-00")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {selectField("Cargo", "position", POSITIONS.map(p => ({ value: p, label: p })), "Selecione...")}
            {selectField("Departamento", "department", DEPARTMENTS.map(d => ({ value: d, label: d })), "Selecione...")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {selectField("Tipo", "employment_type", [
              { value: "CLT", label: "CLT" },
              { value: "PJ", label: "PJ" },
              { value: "Estágio", label: "Estágio" },
              { value: "Temporário", label: "Temporário" },
            ])}
            {inputField("Salário (R$)", "salary", "number", "0,00")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inputField("Admissão", "admission_date", "date")}
            {selectField("Status", "status", [
              { value: "ativo", label: "Ativo" },
              { value: "inativo", label: "Inativo" },
              { value: "ferias", label: "Férias" },
            ])}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inputField("Email", "email", "email", "email@empresa.com")}
            {inputField("PIS", "pis", "text", "000.00000.00-0")}
          </div>
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
