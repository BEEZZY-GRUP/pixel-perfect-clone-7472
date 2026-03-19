import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  categories: Category[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategorySidebar = ({ categories, activeSlug, onSelect }: Props) => {
  return (
    <nav className="p-3 overflow-y-auto h-full scrollbar-gold">
      {/* Header */}
      <div className="px-2 pt-1 pb-3 mb-3 border-b border-border">
        <p className="text-[.55rem] font-heading tracking-[.2em] uppercase text-gold/50">
          Categorias
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onSelect(null)}
          className={`text-left px-2.5 py-2.5 transition-colors rounded-sm ${
            activeSlug === null
              ? "bg-gold/10 text-gold border-l-2 border-gold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary border-l-2 border-transparent"
          }`}
        >
          <span className="text-[.6rem] tracking-wide font-heading uppercase flex items-center gap-1.5">
            📋 Todas
          </span>
          <span className="block text-[.5rem] leading-tight mt-0.5 opacity-50 normal-case tracking-normal font-sans">
            Tudo
          </span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.slug)}
            className={`text-left px-2.5 py-2.5 transition-colors rounded-sm ${
              activeSlug === cat.slug
                ? "bg-gold/10 text-gold border-l-2 border-gold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary border-l-2 border-transparent"
            }`}
          >
            <span className="text-[.6rem] tracking-wide font-heading uppercase flex items-center gap-1">
              {cat.emoji} {cat.name}
              {cat.staff_only && (
                <span className="text-[.45rem] text-gold/60 bg-gold/5 px-0.5 rounded-sm">S</span>
              )}
            </span>
            {cat.description && (
              <span className="block text-[.5rem] leading-tight mt-0.5 opacity-50 normal-case tracking-normal font-sans line-clamp-1">
                {cat.description}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom decoration */}
      <div className="pt-3 mt-3 border-t border-border">
        <div className="px-2.5 py-2 bg-secondary/30 rounded-sm">
          <p className="text-[.5rem] text-muted-foreground/60 font-heading tracking-wider uppercase mb-1">
            💡 Dica
          </p>
          <p className="text-[.5rem] text-muted-foreground/50 leading-relaxed">
            Selecione uma categoria para filtrar os posts.
          </p>
        </div>
      </div>
    </nav>
  );
};

export default CategorySidebar;
