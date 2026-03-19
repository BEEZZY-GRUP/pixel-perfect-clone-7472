
-- Trigger for post creation (XP, badges, missions)
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.on_post_created();

-- Trigger for comment creation (XP, badges, missions)
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_comment_created();

-- Trigger for comment notifications
CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_comment_notify();

-- Trigger for announcement notifications
CREATE TRIGGER on_announcement_notify
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.on_announcement_notify();

-- Trigger for reaction notifications
CREATE TRIGGER on_reaction_notify
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_reaction_notify();
