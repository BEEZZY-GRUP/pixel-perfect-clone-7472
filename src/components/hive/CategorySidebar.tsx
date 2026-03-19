import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  categories: Category[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategorySidebar = ({ categories, activeSlug, onSelect }: Props) => {
  const { data: postCounts } = useQuery({
    queryKey: ["category_post_counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("category_id");
      if (!data) return {};
      const counts: Record<string, number> = {};
      data.forEach((p) => {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });
      return counts;
    },
  });

  const totalPosts = postCounts
    ? Object.values(postCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <nav className="p-3 overflow-y-auto h-full scrollbar-gold">
      {/* Header */}
      <div className="px-2 pt-1 pb-3 mb-3 border-b border-border">
        <p className="text-xs font-heading tracking-[.2em] uppercase text-gold/70">
          Categorias
        </p>
      </div>

      {/* Two-column grid */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onSelect(null)}
          className={`text-left px-3 py-3 transition-colors rounded-sm ${
            activeSlug === null || activeSlug === "todas"
              ? "bg-gold/10 text-gold border-l-2 border-gold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary border-l-2 border-transparent"
          }`}
        >
          <span className="text-xs tracking-wide font-heading uppercase flex items-center gap-1.5">
            📋 Todas
          </span>
          <span className="block text-[.6rem] leading-tight mt-1 opacity-60 normal-case tracking-normal font-sans">
            {totalPosts} publicações
          </span>
        </button>

        {categories.map((cat) => {
          const count = postCounts?.[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.slug)}
              className={`text-left px-3 py-3 transition-colors rounded-sm ${
                activeSlug === cat.slug
                  ? "bg-gold/10 text-gold border-l-2 border-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border-l-2 border-transparent"
              }`}
            >
              <span className="text-xs tracking-wide font-heading uppercase flex items-center gap-1.5">
                {cat.emoji} {cat.name}
                {cat.staff_only && (
                  <span className="text-[.5rem] text-gold/60 bg-gold/5 px-1 rounded-sm">S</span>
                )}
              </span>
              <span className="block text-[.6rem] leading-tight mt-1 opacity-60 normal-case tracking-normal font-sans">
                {count} {count === 1 ? "publicação" : "publicações"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom decoration */}
      <div className="pt-3 mt-3 border-t border-border">
        <div className="px-3 py-2.5 bg-secondary/30 rounded-sm">
          <p className="text-[.6rem] text-muted-foreground/60 font-heading tracking-wider uppercase mb-1">
            💡 Dica
          </p>
          <p className="text-[.6rem] text-muted-foreground/50 leading-relaxed">
            Selecione uma categoria para filtrar os posts.
          </p>
        </div>
      </div>
    </nav>
  );
};

export default CategorySidebar;
