-- Re-create all triggers

-- 1. handle_new_user with auto role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, company_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Empresa'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'company_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'company_id')::uuid 
      ELSE NULL 
    END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_post_created ON public.posts;
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.on_post_created();

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.on_comment_created();

DROP TRIGGER IF EXISTS on_comment_notify ON public.comments;
CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.on_comment_notify();

DROP TRIGGER IF EXISTS on_reaction_created ON public.post_reactions;
CREATE TRIGGER on_reaction_created
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.on_reaction_created();

DROP TRIGGER IF EXISTS on_reaction_notify ON public.post_reactions;
CREATE TRIGGER on_reaction_notify
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.on_reaction_notify();

DROP TRIGGER IF EXISTS on_badge_earned ON public.user_badges;
CREATE TRIGGER on_badge_earned
  AFTER INSERT ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.on_badge_earned();

DROP TRIGGER IF EXISTS on_announcement_notify ON public.posts;
CREATE TRIGGER on_announcement_notify
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.on_announcement_notify();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_glossary_updated_at ON public.glossary;
CREATE TRIGGER update_glossary_updated_at BEFORE UPDATE ON public.glossary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_comments_updated_at ON public.video_comments;
CREATE TRIGGER update_video_comments_updated_at BEFORE UPDATE ON public.video_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();