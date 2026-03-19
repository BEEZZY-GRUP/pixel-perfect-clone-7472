import { useState } from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const { data: results } = useQuery({
    queryKey: ["search_posts", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await supabase
        .from("posts")
        .select("id, title, created_at, categories!posts_category_id_fkey(emoji, name)")
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 10_000,
  });

  const showResults = focused && query.length >= 2 && results && results.length > 0;

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 border rounded-md px-3 py-2 transition-all ${
        focused ? "border-gold/40 bg-secondary/50" : "border-border bg-card"
      }`}>
        <Search size={14} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Pesquisar publicações..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className="bg-transparent text-[.78rem] text-foreground placeholder:text-muted-foreground/50 outline-none w-full font-heading"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-card rounded-md shadow-lg z-50 max-h-[320px] overflow-y-auto scrollbar-thin">
          {results.map((post: any) => (
            <button
              key={post.id}
              onMouseDown={() => {
                navigate(`/the-hive/community/post/${post.id}`);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-secondary/60 transition-colors border-b border-border last:border-b-0 group"
            >
              <p className="text-foreground text-[.75rem] leading-snug line-clamp-1 group-hover:text-gold transition-colors font-medium">
                {post.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[.55rem] text-gold/50">
                  {post.categories?.emoji} {post.categories?.name}
                </span>
                <span className="text-border text-[.5rem]">·</span>
                <span className="text-muted-foreground/50 text-[.55rem]">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {focused && query.length >= 2 && results?.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-card rounded-md shadow-lg z-50 p-4 text-center">
          <p className="text-muted-foreground text-[.72rem]">Nenhum resultado encontrado</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
