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
          className={`w-full text-left px-3 py-2 text-xs tracking-wide font-heading transition-colors rounded-sm ${
            activeSlug === cat.slug
              ? "bg-gold/10 text-gold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          {cat.emoji} {cat.name}
          {cat.staff_only && (
            <span className="ml-2 text-[.6rem] text-gold/60">STAFF</span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default CategorySidebar;
