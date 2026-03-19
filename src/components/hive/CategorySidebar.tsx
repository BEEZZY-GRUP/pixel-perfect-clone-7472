import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  categories: Category[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategorySidebar = ({ categories, activeSlug, onSelect }: Props) => {
  return (
    <nav className="p-4 space-y-1 overflow-y-auto h-full scrollbar-thin">
      {/* Header */}
      <div className="px-3 pt-1 pb-3 mb-2 border-b border-border">
        <p className="text-[.55rem] font-heading tracking-[.2em] uppercase text-gold/50">
          Categorias
        </p>
      </div>

      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2.5 text-xs tracking-wide font-heading uppercase transition-colors rounded-sm ${
          activeSlug === null
            ? "bg-gold/10 text-gold border-l-2 border-gold"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        <span className="flex items-center gap-2">
          📋 Todas
        </span>
        <span className="block text-[.55rem] leading-tight mt-0.5 opacity-50 normal-case tracking-normal font-sans">
          Ver todas as publicações
        </span>
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={`w-full text-left px-3 py-2.5 transition-colors rounded-sm ${
            activeSlug === cat.slug
              ? "bg-gold/10 text-gold border-l-2 border-gold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary border-l-2 border-transparent"
          }`}
        >
          <span className="text-xs tracking-wide font-heading uppercase flex items-center gap-1.5">
            {cat.emoji} {cat.name}
            {cat.staff_only && (
              <span className="text-[.5rem] text-gold/60 bg-gold/5 px-1 py-0.5 rounded-sm">STAFF</span>
            )}
          </span>
          {cat.description && (
            <span className="block text-[.55rem] leading-tight mt-1 opacity-50 normal-case tracking-normal font-sans line-clamp-2">
              {cat.description}
            </span>
          )}
        </button>
      ))}

      {/* Bottom decoration */}
      <div className="pt-4 mt-4 border-t border-border">
        <div className="px-3 py-2 bg-secondary/30 rounded-sm">
          <p className="text-[.5rem] text-muted-foreground/60 font-heading tracking-wider uppercase mb-1">
            💡 Dica
          </p>
          <p className="text-[.55rem] text-muted-foreground/50 leading-relaxed">
            Selecione uma categoria para filtrar os posts e ver o conteúdo que mais interessa.
          </p>
        </div>
      </div>
    </nav>
  );
};

export default CategorySidebar;
