import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PublicProfileView from "./PublicProfileView";
import CategorySidebar from "./CategorySidebar";
import WelcomeHome from "./WelcomeHome";
import PostList from "./PostList";
import CreatePostDialog from "./CreatePostDialog";
import RankingPanel from "./RankingPanel";
import MissionsPanel from "./MissionsPanel";
import ProfilePanel from "./ProfilePanel";
import AdminPanel from "./AdminPanel";

import VideosPanel from "./VideosPanel";
import GlossaryPanel from "./GlossaryPanel";
import NotificationsPanel from "./NotificationsPanel";
import SidebarWidgets from "./SidebarWidgets";
import PostDetail from "./PostDetail";
import { Button } from "@/components/ui/button";
import {
  LogOut, Plus, Menu, X, Trophy, Target, User, Shield, Home,
  Video, BookOpen, MessageCircle, Bell,
} from "lucide-react";

type View = "feed" | "videos" | "glossary" | "ranking" | "missions" | "profile" | "admin" | "notifications";

const VIEW_MAP: Record<string, View> = {
  videos: "videos",
  glossary: "glossary",
  ranking: "ranking",
  missions: "missions",
  profile: "profile",
  admin: "admin",
  notifications: "notifications",
};

const CommunityLayout = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Derive view from URL
  const routeView = params.view ? VIEW_MAP[params.view] : undefined;
  const isPostDetail = !!params.postId;
  const isProfileView = window.location.pathname.includes("/profile/") && params.userId;
  const activeView: View = routeView ?? "feed";

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

  const { data: unreadCount } = useQuery({
    queryKey: ["unread_notifications", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/the-hive");
  };

  const handleCategorySelect = (slug: string | null) => {
    if (slug) {
      navigate(`/the-hive/community?category=${slug}`);
    } else {
      navigate("/the-hive/community");
    }
    setSidebarOpen(false);
  };

  const handleViewChange = (view: View) => {
    if (view === "feed") {
      navigate("/the-hive/community");
    } else {
      navigate(`/the-hive/community/${view}`);
    }
  };

  const notifIcon = (
    <span className="relative">
      <Bell size={14} />
      {(unreadCount ?? 0) > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-gold text-background text-[.5rem] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {unreadCount! > 9 ? "9+" : unreadCount}
        </span>
      )}
    </span>
  );

  const isHome = activeView === "feed" && !activeCategory && !isPostDetail;

  const navItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "feed", label: "Início", icon: <MessageCircle size={14} /> },
    { key: "notifications", label: "Notificações", icon: notifIcon },
    { key: "videos", label: "Vídeos", icon: <Video size={14} /> },
    { key: "glossary", label: "Sumário", icon: <BookOpen size={14} /> },
    { key: "ranking", label: "Ranking", icon: <Trophy size={14} /> },
    { key: "missions", label: "Missões", icon: <Target size={14} /> },
    { key: "profile", label: "Perfil", icon: <User size={14} /> },
    ...(isAdmin ? [{ key: "admin" as View, label: "Admin", icon: <Shield size={14} /> }] : []),
  ];

  const showLeftSidebar = activeView === "feed" && !isPostDetail && !isHome;
  const showRightSidebar = ["feed", "videos", "glossary"].includes(activeView) && !isPostDetail && !isHome;

  return (
    <div className="min-h-screen bg-background" style={{ zoom: 1.25 }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-foreground"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button onClick={() => navigate("/the-hive/community")} className="font-sans font-extrabold text-[1rem] tracking-[.22em] uppercase text-foreground">
            Beezzy<span className="text-gold">.</span>
          </button>
          <span className="text-muted-foreground text-[.65rem] tracking-widest uppercase font-heading hidden sm:inline">
            The Hive
          </span>
        </div>

        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleViewChange(item.key)}
              className={`flex items-center gap-1 px-2 md:px-3 py-1.5 text-[.6rem] md:text-[.65rem] tracking-wider uppercase font-heading transition-colors rounded-sm whitespace-nowrap ${
                activeView === item.key && !isPostDetail
                  ? "bg-gold/10 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}

          {profile && (
            <div className="hidden lg:flex items-center gap-1 px-3 py-1.5 border border-gold/20 ml-2">
              <span className="text-gold text-[.65rem] font-heading font-semibold">
                Lv.{profile.level}
              </span>
              <span className="text-muted-foreground text-[.6rem]">
                {profile.xp}XP
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground ml-1 shrink-0"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </header>


      <div className="flex pt-[57px]">
        {/* Left Sidebar */}
        {showLeftSidebar && (
          <aside className={`
            fixed md:sticky top-[57px] h-[calc(100vh-57px)] left-0 z-40 w-[280px] border-r border-border bg-background
            transition-transform duration-200 overflow-y-auto scrollbar-thin
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}>
            <CategorySidebar
              categories={categories ?? []}
              activeSlug={activeCategory}
              onSelect={handleCategorySelect}
            />
          </aside>
        )}

        {sidebarOpen && showLeftSidebar && (
          <div
            className="fixed inset-0 z-30 bg-background/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-85px)] px-4 md:px-6 py-6">
          <div className={`mx-auto ${showRightSidebar ? "max-w-[1100px]" : "max-w-[720px]"}`}>
            <div className={`${showRightSidebar ? "flex gap-6" : ""}`}>
              <div className={`${showRightSidebar ? "flex-1 min-w-0" : ""}`}>
                {/* Post detail view */}
                {isPostDetail && params.postId && (
                  <PostDetail
                    postId={params.postId}
                    onBack={() => navigate(-1)}
                    isAdmin={isAdmin}
                  />
                )}

                {/* Home welcome view */}
                {isHome && (
                  <WelcomeHome onCreatePost={() => setShowCreate(true)} />
                )}

                {/* Feed view (when category selected) */}
                {activeView === "feed" && !isPostDetail && activeCategory && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="font-heading text-lg tracking-wide text-foreground flex items-center gap-2">
                          {(categories?.find((c) => c.slug === activeCategory)?.emoji ?? "") + " " +
                            (categories?.find((c) => c.slug === activeCategory)?.name ?? "")}
                        </h1>
                        {(() => {
                          const cat = categories?.find((c) => c.slug === activeCategory);
                          return cat?.description ? (
                            <p className="text-muted-foreground text-[.75rem] leading-relaxed mt-1 max-w-lg">
                              {cat.description}
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-gold text-background hover:bg-gold-light font-heading text-[.65rem] tracking-widest uppercase gap-2 shrink-0"
                      >
                        <Plus size={14} />
                        Publicar
                      </Button>
                    </div>

                    <PostList categorySlug={activeCategory} categories={categories ?? []} isAdmin={isAdmin} />
                  </>
                )}

                {activeView === "notifications" && <NotificationsPanel />}
                {activeView === "videos" && <VideosPanel />}
                {activeView === "glossary" && <GlossaryPanel />}
                {activeView === "ranking" && <RankingPanel />}
                {activeView === "missions" && <MissionsPanel />}
                {activeView === "profile" && !isProfileView && <ProfilePanel />}
                {isProfileView && params.userId && (
                  <PublicProfileView userId={params.userId} onBack={() => navigate(-1)} />
                )}
                {activeView === "admin" && <AdminPanel />}
              </div>

              {showRightSidebar && (
                <aside className="hidden lg:block w-[260px] shrink-0">
                  <div className="sticky top-[100px]">
                    <SidebarWidgets />
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>

      <CreatePostDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        categories={categories ?? []}
        defaultCategorySlug={activeCategory}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default CommunityLayout;
