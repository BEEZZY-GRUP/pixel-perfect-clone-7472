import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ChevronDown } from "lucide-react";

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
    { slug: "todas", name: "Todas", emoji: "📋", count: totalPosts, description: "Ver todas as publicações da comunidade" },
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
      {/* Collapsible category header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🏷️</span>
          <h3 className="font-heading text-[.8rem] tracking-wide font-semibold text-foreground">
            Comunidade The Hive
          </h3>
        </div>
        <ChevronDown size={16} className="text-muted-foreground" />
      </div>

      {/* Category cards grid — 2 columns like the reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allItems.map((item) => {
          const isActive = item.slug === null
            ? (activeSlug === null || activeSlug === "todas")
            : activeSlug === item.slug;

          return (
            <button
              key={item.slug ?? "todas"}
              onClick={() => onSelect(item.slug)}
              className={`relative text-left rounded-lg border overflow-hidden transition-all duration-200 group ${
                isActive
                  ? "border-gold/40 bg-gold/8 ring-1 ring-gold/20"
                  : "border-border bg-card hover:border-gold/20 hover:bg-secondary/30"
              }`}
            >
              {/* Top accent bar */}
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />
              )}

              <div className="p-4">
                {/* Emoji + Title + Count */}
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5 block">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[.78rem] font-heading tracking-wide font-semibold block leading-tight ${
                        isActive ? "text-gold" : "text-foreground group-hover:text-gold"
                      } transition-colors`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[.6rem] text-muted-foreground/60 mt-0.5 block font-heading">
                      {item.count} {item.count === 1 ? "post" : "posts"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-[.68rem] text-muted-foreground/70 leading-relaxed mt-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryGrid;
