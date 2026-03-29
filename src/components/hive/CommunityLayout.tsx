import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PageBackground from "@/components/PageBackground";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PublicProfileView from "./PublicProfileView";
import LoadingScreen from "./LoadingScreen";
import CategoryGrid from "./CategoryGrid";
import WelcomeHome from "./WelcomeHome";
import PostList from "./PostList";
import CreatePostDialog from "./CreatePostDialog";
import RankingPanel from "./RankingPanel";
import MissionsPanel from "./MissionsPanel";
import ProfilePanel from "./ProfilePanel";
import AdminPanel from "./AdminPanel";
import BadgeUnlockCelebration from "./BadgeUnlockCelebration";

import VideosPanel from "./VideosPanel";
import GlossaryPanel from "./GlossaryPanel";
import NotificationsPanel from "./NotificationsPanel";
import SidebarWidgets from "./SidebarWidgets";
import SearchBar from "./SearchBar";
import PostDetail from "./PostDetail";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LogOut, Plus, Menu, X, Trophy, Target, User, Shield, Home,
  Video, BookOpen, MessageCircle, Bell,
} from "lucide-react";

type View = "feed" | "community" | "videos" | "glossary" | "ranking" | "missions" | "profile" | "admin" | "notifications";

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
  const { isAdmin, isModerator } = useIsAdmin();
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

  const { data: profile, isLoading: profileLoading } = useQuery({
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

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      return data ?? [];
    },
  });
  // Prefetch all community content during loading
  const { isLoading: postsLoading } = useQuery({
    queryKey: ["posts", null],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, categories!posts_category_id_fkey(name, emoji, slug), comments(count)")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!data?.length) return [];
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, company_name, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
      return data.map((post) => ({ ...post, profile: profileMap.get(post.user_id) ?? null }));
    },
  });

  const { isLoading: statsLoading } = useQuery({
    queryKey: ["community_stats"],
    queryFn: async () => {
      const [postsRes, commentsRes, profilesRes, badgesRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_badges").select("id", { count: "exact", head: true }),
      ]);
      return { posts: postsRes.count ?? 0, comments: commentsRes.count ?? 0, members: profilesRes.count ?? 0, badgesEarned: badgesRes.count ?? 0 };
    },
    staleTime: 60_000,
  });

  const { isLoading: topMembersLoading } = useQuery({
    queryKey: ["top_3_members"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, company_name, level, xp, avatar_url").order("xp", { ascending: false }).limit(3);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { isLoading: recentPostsLoading } = useQuery({
    queryKey: ["recent_posts_sidebar"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, created_at, categories!posts_category_id_fkey(emoji, name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { isLoading: badgesLoading } = useQuery({
    queryKey: ["all_badges"],
    queryFn: async () => {
      const { data } = await supabase.from("badges").select("*").order("name");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { isLoading: missionsLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { data } = await supabase.from("missions").select("*").eq("active", true).order("created_at");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const { isLoading: postCountsLoading } = useQuery({
    queryKey: ["category_post_counts"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("category_id");
      if (!data) return {};
      const counts: Record<string, number> = {};
      data.forEach((p) => { counts[p.category_id] = (counts[p.category_id] || 0) + 1; });
      return counts;
    },
  });

  const isDataLoading = profileLoading || categoriesLoading || postsLoading || statsLoading || topMembersLoading || recentPostsLoading || badgesLoading || missionsLoading || postCountsLoading;

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
  });

  // Realtime: update unread count + show toast on new notification
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notif_badge_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["unread_notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          // Show toast
          const title = payload.new?.title;
          if (title) {
            toast(title, {
              description: payload.new?.body || undefined,
              action: payload.new?.link
                ? { label: "Ver", onClick: () => navigate(payload.new.link) }
                : undefined,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread_notifications", user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/the-hive");
  };

  const handleCategorySelect = (slug: string | null) => {
    if (slug) {
      navigate(`/the-hive/community?category=${slug}`);
    } else {
      navigate("/the-hive/community?category=todas");
    }
    setSidebarOpen(false);
  };

  const handleViewChange = (view: View) => {
    if (view === "feed") {
      navigate("/the-hive/community");
    } else if (view === "community") {
      navigate("/the-hive/community?category=browse");
    } else {
      navigate(`/the-hive/community/${view}`);
    }
  };

  const notifIcon = (
    <span className="relative">
      <Bell size={14} />
      {(unreadCount ?? 0) > 0 && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
      )}
    </span>
  );

  const isBrowsingCategories = activeCategory === "browse";
  const isCategoryDetail = activeView === "feed" && activeCategory && activeCategory !== "browse" && !isPostDetail && !isProfileView;
  const isHome = activeView === "feed" && !activeCategory && !isPostDetail && !isProfileView;

  const navItems: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "feed", label: "Início", icon: <Home size={14} /> },
    { key: "community", label: "Comunidade", icon: <MessageCircle size={14} /> },
    { key: "videos", label: "Vídeos", icon: <Video size={14} /> },
    { key: "glossary", label: "Sumário", icon: <BookOpen size={14} /> },
    { key: "ranking", label: "Ranking", icon: <Trophy size={14} /> },
    { key: "missions", label: "Missões", icon: <Target size={14} /> },
    { key: "notifications", label: "Notificações", icon: notifIcon },
    { key: "profile", label: "Perfil", icon: <User size={14} /> },
    ...(isAdmin ? [{ key: "admin" as View, label: "Admin", icon: <Shield size={14} /> }] : []),
  ];

  const showSidebar = isCategoryDetail || isBrowsingCategories;

  if (isDataLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background community-zoom relative">
      <PageBackground />
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md px-2 sm:px-3 md:px-8">
        <div className="flex items-center justify-between py-2 md:py-3">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-foreground"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button onClick={() => navigate("/the-hive/community")} className="font-display font-black text-[.9rem] sm:text-[1rem] tracking-[-.03em] text-foreground">
              Beezzy<span className="text-gold">.</span>
            </button>
            <span className="text-muted-foreground text-[.6rem] tracking-widest uppercase font-heading hidden md:inline">
              The Hive
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* On mobile: show only icons. On sm+: show labels */}
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleViewChange(item.key)}
                className={`flex items-center gap-1 px-1.5 sm:px-2 md:px-3 py-1.5 text-[.55rem] sm:text-[.6rem] md:text-[.65rem] tracking-wider uppercase font-heading transition-colors rounded-sm whitespace-nowrap ${
                  (item.key === "community" && (isBrowsingCategories || isCategoryDetail)) ||
                  (item.key === "feed" && isHome) ||
                  (item.key !== "feed" && item.key !== "community" && activeView === item.key && !isPostDetail)
                    ? "bg-gold/10 text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground ml-0.5 shrink-0 w-7 h-7 sm:w-8 sm:h-8"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-[57px]">
        {/* Main content */}
        <main className="min-h-[calc(100vh-85px)] px-2 sm:px-3 md:px-6 py-3 md:py-6 overflow-x-hidden">
          <div className={`mx-auto ${showSidebar ? "max-w-[1200px]" : "max-w-[720px]"}`}>
            <div className={`${showSidebar ? "flex gap-6" : ""}`}>
              {/* Left sidebar */}
              {showSidebar && (
                <aside className="hidden lg:block w-[260px] shrink-0">
                  <div className="sticky top-[80px]">
                    <SidebarWidgets />
                  </div>
                </aside>
              )}

              <div className={`${showSidebar ? "flex-1 min-w-0" : ""}`}>
                {/* Post detail view */}
                {isPostDetail && params.postId && (
                  <PostDetail
                    postId={params.postId}
                    onBack={() => navigate(-1)}
                    isAdmin={isAdmin || isModerator}
                  />
                )}

                {/* Home welcome view */}
                {isHome && (
                  <WelcomeHome onCreatePost={() => setShowCreate(true)} />
                )}

                {/* Browse categories view */}
                {activeView === "feed" && isBrowsingCategories && !isPostDetail && (
                  <>
                    <div className="mb-5">
                      <SearchBar />
                    </div>
                    <CategoryGrid
                      categories={categories ?? []}
                      activeSlug={null}
                      onSelect={handleCategorySelect}
                    />
                  </>
                )}

                {/* Category detail view — posts filtered by category */}
                {isCategoryDetail && (
                  <>
                    <div className="mb-5">
                      <SearchBar />
                    </div>

                    {/* Back to categories + category header */}
                    <div className="mb-4">
                      <button
                        onClick={() => navigate("/the-hive/community?category=browse")}
                        className="text-muted-foreground hover:text-gold text-[.65rem] font-heading tracking-wider uppercase mb-3 flex items-center gap-1 transition-colors"
                      >
                        ← Voltar às categorias
                      </button>
                        <div className="flex items-center justify-between gap-2">
                        <h1 className="font-heading text-base sm:text-lg tracking-wide text-foreground flex items-center gap-2 min-w-0 truncate">
                          {activeCategory === "todas"
                            ? "📋 Todas as Publicações"
                            : (categories?.find((c) => c.slug === activeCategory)?.emoji ?? "") + " " +
                              (categories?.find((c) => c.slug === activeCategory)?.name ?? "")}
                        </h1>
                        {(() => {
                          const isAvisos = activeCategory === "avisos";
                          const canPostHere = !isAvisos || isAdmin || isModerator;
                          return canPostHere ? (
                            <Button
                              onClick={() => setShowCreate(true)}
                              className="bg-gold text-background hover:bg-gold-light font-heading text-[.55rem] sm:text-[.65rem] tracking-widest uppercase gap-1.5 sm:gap-2 shrink-0 px-2 sm:px-3 h-8 sm:h-9"
                            >
                              <Plus size={14} />
                              <span className="hidden sm:inline">Criar publicação</span>
                              <span className="sm:hidden">Criar</span>
                            </Button>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {(() => {
                      if (activeCategory === "todas") return null;
                      const cat = categories?.find((c) => c.slug === activeCategory);
                      return cat?.description ? (
                        <p className="text-muted-foreground text-[.75rem] leading-relaxed mb-4 max-w-lg">
                          {cat.description}
                        </p>
                      ) : null;
                    })()}

                    <PostList categorySlug={activeCategory === "todas" ? null : activeCategory} categories={categories ?? []} isAdmin={isAdmin} />
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
        isModerator={isModerator}
      />
      <BadgeUnlockCelebration />
    </div>
  );
};

export default CommunityLayout;
