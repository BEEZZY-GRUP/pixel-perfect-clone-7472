import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "./types";
import { toast } from "sonner";

interface LeadsContextType {
  leads: Lead[];
  archivedLeads: Lead[];
  loading: boolean;
  refresh: () => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  restoreLead: (id: string) => Promise<void>;
  permanentDelete: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, "id" | "created_at" | "updated_at" | "archived" | "archived_at">) => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | null>(null);

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [active, archived] = await Promise.all([
      supabase.from("leads").select("*").eq("archived", false).order("created_at", { ascending: false }),
      supabase.from("leads").select("*").eq("archived", true).order("archived_at", { ascending: false }),
    ]);
    if (active.data) setLeads(active.data as unknown as Lead[]);
    if (archived.data) setArchivedLeads(archived.data as unknown as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const { error } = await supabase.from("leads").update(updates as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar lead"); return; }
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").update({ archived: true, archived_at: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast.error("Erro ao arquivar lead"); return; }
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      const updated = { ...lead, archived: true, archived_at: new Date().toISOString() };
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setArchivedLeads((prev) => [updated, ...prev]);
    }
    toast.success("Lead movido para a lixeira");
  };

  const restoreLead = async (id: string) => {
    const { error } = await supabase.from("leads").update({ archived: false, archived_at: null } as any).eq("id", id);
    if (error) { toast.error("Erro ao restaurar lead"); return; }
    const lead = archivedLeads.find((l) => l.id === id);
    if (lead) {
      const updated = { ...lead, archived: false, archived_at: null };
      setArchivedLeads((prev) => prev.filter((l) => l.id !== id));
      setLeads((prev) => [updated, ...prev]);
    }
    toast.success("Lead restaurado");
  };

  const permanentDelete = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir permanentemente"); return; }
    setArchivedLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead excluído permanentemente");
  };

  const addLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at" | "archived" | "archived_at">) => {
    const { data, error } = await supabase.from("leads").insert(lead as any).select().single();
    if (error) { toast.error("Erro ao criar lead"); return; }
    setLeads((prev) => [data as unknown as Lead, ...prev]);
    toast.success("Lead criado com sucesso");
  };

  return (
    <LeadsContext.Provider value={{ leads, archivedLeads, loading, refresh, updateLead, deleteLead, restoreLead, permanentDelete, addLead }}>
      {children}
    </LeadsContext.Provider>
  );
}
