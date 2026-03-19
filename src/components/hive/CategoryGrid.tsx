import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  categories: Category[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

const CategoryGrid = ({ categories, activeSlug, onSelect }: Props) => {
  const { data: postCounts } = useQuery({
    queryKey: ["category_post_counts"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("category_id");
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

  const allItems = [
    { slug: null, name: "Todas", emoji: "📋", count: totalPosts, description: "Todas as publicações" },
    ...categories.map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      emoji: cat.emoji ?? "📌",
      count: postCounts?.[cat.id] ?? 0,
      description: cat.description,
    })),
  ];

  return (
    <div className="mb-6">
      <p className="text-[.6rem] font-heading tracking-[.2em] uppercase text-muted-foreground mb-3">
        Categorias
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {allItems.map((item) => {
          const isActive = item.slug === null
            ? (activeSlug === null || activeSlug === "todas")
            : activeSlug === item.slug;

          return (
            <button
              key={item.slug ?? "todas"}
              onClick={() => onSelect(item.slug)}
              className={`relative text-left p-3 rounded-md border transition-all duration-200 group overflow-hidden ${
                isActive
                  ? "border-gold/40 bg-gold/10 shadow-[0_0_12px_-4px_hsl(var(--gold)/0.2)]"
                  : "border-border bg-card hover:border-gold/20 hover:bg-secondary/50"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />
              )}
              <span className="text-lg leading-none block mb-1.5">{item.emoji}</span>
              <span className={`text-[.7rem] font-heading tracking-wider uppercase block leading-tight ${
                isActive ? "text-gold" : "text-foreground group-hover:text-gold"
              } transition-colors`}>
                {item.name}
              </span>
              <span className="text-[.55rem] text-muted-foreground/60 mt-0.5 block">
                {item.count} {item.count === 1 ? "post" : "posts"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryGrid;
