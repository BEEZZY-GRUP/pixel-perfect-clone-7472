import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen, Plus, Save, Trash2, Search, Pencil, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  marketing: "text-emerald-400 bg-emerald-400/10",
  financeiro: "text-sky-400 bg-sky-400/10",
  gestão: "text-violet-400 bg-violet-400/10",
  vendas: "text-amber-400 bg-amber-400/10",
};

const ITEMS_PER_PAGE = 20;

const GlossaryPanel = () => {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ term: "", definition: "", category: "marketing" });
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: terms, isLoading } = useQuery({
    queryKey: ["glossary"],
    queryFn: async () => {
      const { data } = await supabase.from("glossary").select("*").order("term");
      return data ?? [];
    },
  });

  const saveTerm = useMutation({
    mutationFn: async (vals: typeof form & { id?: string }) => {
      if (vals.id) {
        const { error } = await supabase.from("glossary").update({ term: vals.term, definition: vals.definition, category: vals.category }).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("glossary").insert({ term: vals.term, definition: vals.definition, category: vals.category });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Termo atualizado!" : "Termo adicionado!");
      queryClient.invalidateQueries({ queryKey: ["glossary"] });
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar termo."),
  });

  const deleteTerm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("glossary").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Termo excluído!");
      queryClient.invalidateQueries({ queryKey: ["glossary"] });
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const resetForm = () => {
    setCreating(false);
    setEditingId(null);
    setForm({ term: "", definition: "", category: "marketing" });
  };

  // Reset page when filters change
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleFilterCat = (cat: string | null) => { setFilterCat(cat); setPage(1); };

  const allCategories = [...new Set(terms?.map((t: any) => t.category) ?? [])].sort();

  const filtered = terms?.filter((t: any) => {
    const matchSearch = !search || t.term.toLowerCase().includes(search.toLowerCase()) || t.definition.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || t.category === filterCat;
    return matchSearch && matchCat;
  }) ?? [];

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Group paginated items by letter
  const grouped = paginatedItems.reduce((acc: Record<string, any[]>, t: any) => {
    const letter = t.term[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedLetters = Object.keys(grouped).sort();

  // All unique letters for quick-nav
  const allLetters = [...new Set(filtered.map((t: any) => t.term[0].toUpperCase()))].sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-gold" />
          <h1 className="font-heading text-lg tracking-wide text-foreground">Sumário</h1>
          <span className="text-muted-foreground text-xs font-heading">{filtered.length} termos</span>
        </div>
        {isAdmin && !creating && (
          <Button onClick={() => setCreating(true)} className="bg-gold text-background hover:bg-gold-light font-heading text-xs tracking-widest uppercase gap-2">
            <Plus size={14} /> Novo Termo
          </Button>
        )}
      </div>

      {(creating || editingId) && isAdmin && (
        <div className="border border-gold/20 bg-gold/5 p-5 mb-6 space-y-3">
          <p className="text-xs text-gold uppercase tracking-wider font-heading">{editingId ? "Editar termo" : "Adicionar novo termo"}</p>
          <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="Termo (ex: CAC, ROI)" className="bg-secondary border-border text-foreground text-sm" />
          <Textarea value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} placeholder="Definição completa..." className="bg-secondary border-border text-foreground text-sm min-h-[80px] resize-none" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-secondary border border-border text-foreground text-sm px-3 py-2 font-heading">
            <option value="marketing">Marketing</option>
            <option value="financeiro">Financeiro</option>
            <option value="gestão">Gestão</option>
            <option value="vendas">Vendas</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveTerm.mutate({ ...form, id: editingId || undefined })} disabled={!form.term || !form.definition || saveTerm.isPending} className="bg-gold text-background hover:bg-gold-light text-xs tracking-wider uppercase font-heading h-8 gap-1">
              <Save size={12} /> Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm} className="text-muted-foreground text-xs h-8">Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Buscar termo..." className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => handleFilterCat(null)} className={`px-2.5 py-1 text-xs font-heading tracking-wider uppercase transition-colors ${!filterCat ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"}`}>Todos</button>
          {allCategories.map((cat: string) => (
            <button key={cat} onClick={() => handleFilterCat(filterCat === cat ? null : cat)} className={`px-2.5 py-1 text-xs font-heading tracking-wider uppercase transition-colors ${filterCat === cat ? (CATEGORY_COLORS[cat]?.split(" ")[0] ?? "text-gold") + " " + (CATEGORY_COLORS[cat]?.split(" ")[1] ?? "bg-gold/10") : "text-muted-foreground hover:text-foreground"}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Letter quick-nav */}
      {allLetters.length > 5 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {allLetters.map((letter) => (
            <button key={letter} onClick={() => {
              // Find which page this letter starts on
              const idx = filtered.findIndex((t: any) => t.term[0].toUpperCase() === letter);
              if (idx >= 0) setPage(Math.floor(idx / ITEMS_PER_PAGE) + 1);
            }} className="w-7 h-7 flex items-center justify-center text-xs font-heading text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors">
              {letter}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border border-border p-4 animate-pulse">
              <div className="h-4 bg-secondary rounded w-1/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="border border-border p-12 text-center">
          <BookOpen size={32} className="text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum termo encontrado.</p>
        </div>
      )}

      {/* Terms list */}
      <div className="space-y-6">
        {sortedLetters.map((letter) => (
          <div key={letter} id={`glossary-${letter}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gold font-heading text-2xl font-semibold leading-none">{letter}</span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
            <div className="space-y-1">
              {grouped[letter].map((term: any) => {
                const isExpanded = expandedId === term.id;
                const catColor = CATEGORY_COLORS[term.category] ?? "text-gold bg-gold/10";
                return (
                  <div key={term.id} className="border border-border bg-card hover:border-gold/15 transition-colors">
                    <button onClick={() => setExpandedId(isExpanded ? null : term.id)} className="w-full text-left p-4 flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={14} className="text-gold shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                      <span className="text-foreground text-base font-medium flex-1">{term.term}</span>
                      <span className={`text-xs font-heading tracking-wider uppercase px-2.5 py-0.5 shrink-0 ${catColor}`}>{term.category}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-10">
                        <p className="text-foreground/80 text-sm leading-relaxed">{term.definition}</p>
                        {isAdmin && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => { setEditingId(term.id); setForm({ term: term.term, definition: term.definition, category: term.category }); }} className="text-muted-foreground hover:text-foreground text-xs font-heading tracking-wider uppercase flex items-center gap-1 px-2 py-1 transition-colors">
                              <Pencil size={11} /> Editar
                            </button>
                            <button onClick={() => { if (confirm(`Excluir "${term.term}"?`)) deleteTerm.mutate(term.id); }} className="text-destructive/50 hover:text-destructive text-xs font-heading tracking-wider uppercase flex items-center gap-1 px-2 py-1 transition-colors">
                              <Trash2 size={11} /> Excluir
                            </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground gap-1 font-heading"
          >
            <ChevronLeft size={14} />
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 flex items-center justify-center text-xs font-heading transition-colors ${
                  p === currentPage
                    ? "bg-gold text-background font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground gap-1 font-heading"
          >
            Próxima
            <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Page info */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground/60 mt-3">
          Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} termos
        </p>
      )}
    </div>
  );
};

export default GlossaryPanel;
