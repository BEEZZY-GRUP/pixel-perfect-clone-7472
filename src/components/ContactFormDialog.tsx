import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  company: z.string().trim().min(1, "Empresa é obrigatória").max(100),
  cnpj: z.string().trim().min(1, "CNPJ é obrigatório").max(20),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().max(1000).optional(),
});

type ContactForm = z.infer<typeof contactSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactFormDialog = ({ open, onOpenChange }: Props) => {
  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    company: "",
    cnpj: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof ContactForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof ContactForm;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: result.data.name,
        email: result.data.email,
        company: result.data.company,
        cnpj: result.data.cnpj,
        phone: result.data.phone || null,
        message: result.data.message || null,
      });
      if (error) throw error;
      onOpenChange(false);
      setForm({ name: "", email: "", company: "", cnpj: "", phone: "", message: "" });
      toast.success("Mensagem enviada!", {
        description: "Entraremos em contato em até 24 horas.",
      });
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-transparent border border-border px-4 py-3 text-[.85rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors font-body";
  const errorClass = "text-[.7rem] text-destructive mt-1 font-body";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="font-display text-[1.6rem] font-light tracking-[-0.01em]">
            Falar com a Beezzy
          </DialogTitle>
          <DialogDescription className="text-[.8rem] text-muted-foreground mt-2 leading-relaxed">
            Preencha seus dados e entraremos em contato em até 24 horas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 flex flex-col gap-4">
          <div>
            <input
              type="text"
              placeholder="Seu nome *"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
              maxLength={100}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          <div>
            <input
              type="email"
              placeholder="Seu e-mail *"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              maxLength={255}
            />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Nome da empresa *"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className={inputClass}
              maxLength={100}
            />
            {errors.company && <p className={errorClass}>{errors.company}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="CNPJ *"
              value={form.cnpj}
              onChange={(e) => update("cnpj", e.target.value)}
              className={inputClass}
              maxLength={20}
            />
            {errors.cnpj && <p className={errorClass}>{errors.cnpj}</p>}
          </div>

          <div>
            <input
              type="tel"
              placeholder="Telefone (opcional)"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
              maxLength={20}
            />
          </div>

          <div>
            <textarea
              placeholder="Conte brevemente sobre sua empresa (opcional)"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className={`${inputClass} resize-none h-[90px]`}
              maxLength={1000}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full inline-flex items-center justify-center gap-3 font-heading text-[.72rem] tracking-[.16em] uppercase font-bold text-primary-foreground bg-gold px-10 py-4 hover:bg-gold-light hover:-translate-y-px transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? "Enviando..." : "Enviar mensagem"}
            {!submitting && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <p className="text-center text-[.68rem] text-muted-foreground mt-1">
            Sem compromisso · Seus dados estão seguros
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
