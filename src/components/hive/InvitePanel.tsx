import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

const InvitePanel = () => {
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invite = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: { email: email.trim(), company_id: companyId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success(`Convite enviado para ${email}!`);
      setEmail("");
      setCompanyId("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao enviar convite.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !companyId) return;
    invite.mutate();
  };

  return (
    <div className="border border-border p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail size={14} className="text-gold" />
        <h3 className="font-heading text-xs tracking-widest uppercase text-foreground">
          Convidar Membro
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@empresa.com"
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
          required
        />
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="bg-secondary border-border text-foreground text-sm">
            <SelectValue placeholder="Selecione a empresa" />
          </SelectTrigger>
          <SelectContent>
            {companies?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={invite.isPending || !companyId}
          className="w-full bg-gold text-background hover:bg-gold-light font-heading text-[.65rem] tracking-widest uppercase gap-2"
        >
          <Send size={12} />
          {invite.isPending ? "Enviando..." : "Enviar Convite"}
        </Button>
      </form>

      <p className="text-muted-foreground text-[.6rem] mt-3">
        O membro receberá um email com link para definir a senha e acessar a comunidade.
      </p>
    </div>
  );
};

export default InvitePanel;
