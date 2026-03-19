import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  categories: Category[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategorySidebar = ({ categories, activeSlug, onSelect }: Props) => {
  return (
    <nav className="p-4 space-y-1 overflow-y-auto h-full">
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-left px-3 py-2 text-xs tracking-wide font-heading uppercase transition-colors rounded-sm ${
          activeSlug === null
            ? "bg-gold/10 text-gold"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        📋 Todas
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={`w-full text-left px-3 py-2.5 transition-colors rounded-sm ${
            activeSlug === cat.slug
              ? "bg-gold/10 text-gold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <span className="text-xs tracking-wide font-heading uppercase flex items-center gap-1">
            {cat.emoji} {cat.name}
            {cat.staff_only && (
              <span className="text-[.6rem] text-gold/60">STAFF</span>
            )}
          </span>
          {cat.description && (
            <span className="block text-[.6rem] leading-tight mt-0.5 opacity-60 normal-case tracking-normal font-sans">
              {cat.description}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default CategorySidebar;
