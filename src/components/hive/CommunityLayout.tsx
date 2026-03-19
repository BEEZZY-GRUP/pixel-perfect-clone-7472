import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import CategorySidebar from "./CategorySidebar";
import PostList from "./PostList";
import CreatePostDialog from "./CreatePostDialog";
import RankingPanel from "./RankingPanel";
import MissionsPanel from "./MissionsPanel";
import ProfilePanel from "./ProfilePanel";
import AdminPanel from "./AdminPanel";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Menu, X, Trophy, Target, User, Shield } from "lucide-react";

type View = "feed" | "ranking" | "missions" | "profile" | "admin";

const CommunityLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<View>("feed");

  const activeCategory = searchParams.get("category") || null;

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      return data ?? [];
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/the-hive");
  };

  const handleCategorySelect = (slug: string | null) => {
    setActiveView("feed");
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
    setSidebarOpen(false);
  };

  const navItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "ranking", label: "Ranking", icon: <Trophy size={14} /> },
    { key: "missions", label: "Missões", icon: <Target size={14} /> },
    { key: "profile", label: "Perfil", icon: <User size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-foreground"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button onClick={() => { setActiveView("feed"); setSearchParams({}); }} className="font-sans font-extrabold text-[1rem] tracking-[.22em] uppercase text-foreground">
            Beezzy<span className="text-gold">.</span>
          </button>
          <span className="text-muted-foreground text-[.65rem] tracking-widest uppercase font-heading hidden sm:inline">
            The Hive
          </span>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[.65rem] tracking-wider uppercase font-heading transition-colors rounded-sm ${
                activeView === item.key
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}

          {/* XP badge in header */}
          {profile && (
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 border border-gold/20 ml-2">
              <span className="text-gold text-[.65rem] font-heading font-semibold">
                Lv.{profile.level}
              </span>
              <span className="text-muted-foreground text-[.6rem]">
                {profile.xp}XP
              </span>
            </div>
          )}

          <span className="text-foreground text-xs font-heading tracking-wide hidden lg:inline ml-2">
            {profile?.company_name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground ml-1"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <div className="flex pt-[57px]">
        {/* Sidebar - only show on feed view */}
        {activeView === "feed" && (
          <aside className={`
            fixed md:sticky top-[57px] left-0 z-40 h-[calc(100vh-57px)] w-[260px] border-r border-border bg-background
            transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}>
            <CategorySidebar
              categories={categories ?? []}
              activeSlug={activeCategory}
              onSelect={handleCategorySelect}
            />
          </aside>
        )}

        {/* Overlay for mobile */}
        {sidebarOpen && activeView === "feed" && (
          <div
            className="fixed inset-0 z-30 bg-background/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-57px)] px-4 md:px-8 py-6">
          <div className="max-w-[720px] mx-auto">
            {activeView === "feed" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-heading text-lg tracking-wide text-foreground">
                    {activeCategory
                      ? categories?.find((c) => c.slug === activeCategory)?.emoji + " " +
                        categories?.find((c) => c.slug === activeCategory)?.name
                      : "Todas as publicações"}
                  </h1>
                  <Button
                    onClick={() => setShowCreate(true)}
                    className="bg-gold text-background hover:bg-gold-light font-heading text-[.65rem] tracking-widest uppercase gap-2"
                  >
                    <Plus size={14} />
                    Publicar
                  </Button>
                </div>
                <PostList categorySlug={activeCategory} categories={categories ?? []} />
              </>
            )}

            {activeView === "ranking" && <RankingPanel />}
            {activeView === "missions" && <MissionsPanel />}
            {activeView === "profile" && <ProfilePanel />}
          </div>
        </main>
      </div>

      <CreatePostDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        categories={categories ?? []}
        defaultCategorySlug={activeCategory}
      />
    </div>
  );
};

export default CommunityLayout;
