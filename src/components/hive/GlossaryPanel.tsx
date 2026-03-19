import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, Plus, Save, Trash2, Search, Pencil, ChevronDown, ChevronRight } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  marketing: "text-emerald-400 bg-emerald-400/10",
  financeiro: "text-sky-400 bg-sky-400/10",
  gestão: "text-violet-400 bg-violet-400/10",
  vendas: "text-amber-400 bg-amber-400/10",
};

const GlossaryPanel = () => {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ term: "", definition: "", category: "marketing" });
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const { data: terms, isLoading } = useQuery({
    queryKey: ["glossary"],
    queryFn: async () => { const { data } = await supabase.from("glossary").select("*").order("term"); return data ?? []; },
  });

  const saveTerm = useMutation({
    mutationFn: async (vals: typeof form & { id?: string }) => {
      if (vals.id) { const { error } = await supabase.from("glossary").update({ term: vals.term, definition: vals.definition, category: vals.category }).eq("id", vals.id); if (error) throw error; }
      else { const { error } = await supabase.from("glossary").insert({ term: vals.term, definition: vals.definition, category: vals.category }); if (error) throw error; }
    },
    onSuccess: () => { toast.success(editingId ? "Termo atualizado!" : "Termo adicionado!"); queryClient.invalidateQueries({ queryKey: ["glossary"] }); resetForm(); },
    onError: () => toast.error("Erro ao salvar termo."),
  });

  const deleteTerm = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("glossary").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Termo excluído!"); queryClient.invalidateQueries({ queryKey: ["glossary"] }); },
    onError: () => toast.error("Erro ao excluir."),
  });

  const resetForm = () => { setCreating(false); setEditingId(null); setForm({ term: "", definition: "", category: "marketing" }); };

  const allCategories = [...new Set(terms?.map((t: any) => t.category) ?? [])].sort();
  const filtered = terms?.filter((t: any) => {
    const matchSearch = !search || t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || t.category === filterCat;
    return matchSearch && matchCat;
  });

  const grouped = filtered?.reduce((acc: Record<string, any[]>, t: any) => {
    const letter = t.term[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedLetters = Object.keys(grouped ?? {}).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-gold" />
          <h1 className="font-heading text-lg tracking-wide text-foreground">Sumário</h1>
          <span className="text-muted-foreground text-[.65rem] font-heading">{terms?.length ?? 0} termos</span>
        </div>
        {isAdmin && !creating && (
          <Button onClick={() => setCreating(true)} className="bg-gold text-background hover:bg-gold-light font-heading text-[.65rem] tracking-widest uppercase gap-2"><Plus size={14} /> Novo Termo</Button>
        )}
      </div>

      {(creating || editingId) && isAdmin && (
        <div className="border border-gold/20 bg-gold/5 p-5 mb-6 space-y-3">
          <p className="text-[.65rem] text-gold uppercase tracking-wider font-heading">{editingId ? "Editar termo" : "Adicionar novo termo"}</p>
          <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="Termo (ex: CAC, ROI)" className="bg-secondary border-border text-foreground text-sm" />
          <Textarea value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} placeholder="Definição completa..." className="bg-secondary border-border text-foreground text-sm min-h-[80px] resize-none" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-secondary border border-border text-foreground text-sm px-3 py-2 font-heading">
            <option value="marketing">Marketing</option><option value="financeiro">Financeiro</option><option value="gestão">Gestão</option><option value="vendas">Vendas</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveTerm.mutate({ ...form, id: editingId || undefined })} disabled={!form.term || !form.definition || saveTerm.isPending} className="bg-gold text-background hover:bg-gold-light text-[.6rem] tracking-wider uppercase font-heading h-8 gap-1"><Save size={12} /> Salvar</Button>
            <Button size="sm" variant="ghost" onClick={resetForm} className="text-muted-foreground text-[.6rem] h-8">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar termo..." className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat(null)} className={`px-2.5 py-1 text-[.6rem] font-heading tracking-wider uppercase transition-colors ${!filterCat ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"}`}>Todos</button>
          {allCategories.map((cat: string) => (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat ? null : cat)} className={`px-2.5 py-1 text-[.6rem] font-heading tracking-wider uppercase transition-colors ${filterCat === cat ? (CATEGORY_COLORS[cat]?.split(" ")[0] ?? "text-gold") + " " + (CATEGORY_COLORS[cat]?.split(" ")[1] ?? "bg-gold/10") : "text-muted-foreground hover:text-foreground"}`}>{cat}</button>
          ))}
        </div>
      </div>

      {sortedLetters.length > 5 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {sortedLetters.map((letter) => (<a key={letter} href={`#glossary-${letter}`} className="w-7 h-7 flex items-center justify-center text-[.65rem] font-heading text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors">{letter}</a>))}
        </div>
      )}

      {isLoading && <div className="space-y-2">{[1,2,3,4,5].map((i) => (<div key={i} className="border border-border p-4 animate-pulse"><div className="h-4 bg-secondary rounded w-1/4 mb-2" /><div className="h-3 bg-secondary rounded w-3/4" /></div>))}</div>}

      {!isLoading && sortedLetters.length === 0 && (
        <div className="border border-border p-12 text-center"><BookOpen size={32} className="text-muted-foreground/20 mx-auto mb-3" /><p className="text-muted-foreground text-sm">Nenhum termo encontrado.</p></div>
      )}

      <div className="space-y-6">
        {sortedLetters.map((letter) => (
          <div key={letter} id={`glossary-${letter}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gold font-heading text-2xl font-semibold leading-none">{letter}</span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
            <div className="space-y-1">
              {grouped![letter].map((term: any) => {
                const isExpanded = expandedId === term.id;
                const catColor = CATEGORY_COLORS[term.category] ?? "text-gold bg-gold/10";
                return (
                  <div key={term.id} className="border border-border bg-card hover:border-gold/15 transition-colors">
                    <button onClick={() => setExpandedId(isExpanded ? null : term.id)} className="w-full text-left p-3 flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={12} className="text-gold shrink-0" /> : <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
                      <span className="text-foreground text-sm font-medium flex-1">{term.term}</span>
                      <span className={`text-[.55rem] font-heading tracking-wider uppercase px-2 py-0.5 shrink-0 ${catColor}`}>{term.category}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pl-9">
                        <p className="text-foreground/80 text-[.8rem] leading-relaxed">{term.definition}</p>
                        {isAdmin && (
                          <div className="flex gap-1 mt-2">
                            <button onClick={() => { setEditingId(term.id); setForm({ term: term.term, definition: term.definition, category: term.category }); }} className="text-muted-foreground hover:text-foreground text-[.6rem] font-heading tracking-wider uppercase flex items-center gap-1 px-2 py-1 transition-colors"><Pencil size={10} /> Editar</button>
                            <button onClick={() => { if (confirm(`Excluir "${term.term}"?`)) deleteTerm.mutate(term.id); }} className="text-destructive/50 hover:text-destructive text-[.6rem] font-heading tracking-wider uppercase flex items-center gap-1 px-2 py-1 transition-colors"><Trash2 size={10} /> Excluir</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlossaryPanel;
