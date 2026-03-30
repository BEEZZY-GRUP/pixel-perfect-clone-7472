import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VaultIntegrationsPage = () => {
  const qc = useQueryClient();

  const { data: integrations } = useQuery({
    queryKey: ["vault_integrations"],
    queryFn: async () => { const { data } = await supabase.from("vault_integrations").select("*").order("name"); return data ?? []; },
  });

  const statusBadge = (status: string) => {
    const c: Record<string, string> = {
      conectado: "bg-green-500/10 text-green-400",
      configurado: "bg-amber-500/10 text-amber-400",
      desconectado: "bg-white/5 text-white/40",
    };
    return <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded ${c[status] ?? "bg-white/5 text-white/40"}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const categories = [...new Set(integrations?.map((i: any) => i.category).filter(Boolean) ?? [])];

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Integrações</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Conecte ferramentas externas ao Beezzy Vault</p>
      </div>

      <div className="rounded-xl border border-white/5 p-4 mb-5" style={{ background: "#0e0e0a", borderLeftColor: "#3B82F6", borderLeftWidth: 3 }}>
        <p className="text-xs" style={{ color: "rgba(242,240,232,0.5)" }}>Configure as integrações para expandir as funcionalidades. As chaves de API devem ser configuradas no backend.</p>
      </div>

      {(integrations?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-xs" style={{ color: "rgba(242,240,232,0.3)" }}>Nenhuma integração cadastrada.</div>
      ) : (
        categories.map(cat => {
          const items = integrations?.filter((i: any) => i.category === cat) ?? [];
          return (
            <div key={cat as string} className="mb-5">
              <div className="text-[9px] uppercase tracking-widest mb-2 pb-2 border-b border-white/5" style={{ color: "rgba(242,240,232,0.3)" }}>{cat as string}</div>
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div key={item.id} className="rounded-xl p-4 border border-white/5 flex items-center justify-between" style={{ background: "#0e0e0a" }}>
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-[11px] mt-1" style={{ color: "rgba(242,240,232,0.4)" }}>{item.description}</div>
                    </div>
                    {statusBadge(item.status)}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default VaultIntegrationsPage;
