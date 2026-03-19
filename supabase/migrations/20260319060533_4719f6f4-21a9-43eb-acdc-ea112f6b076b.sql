
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'comment_on_post', 'reaction_on_post', 'announcement'
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update (mark as read) own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- System/triggers insert notifications (via security definer functions)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function: notify on comment created
CREATE OR REPLACE FUNCTION public.on_comment_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_author_id uuid;
  post_title text;
  commenter_name text;
BEGIN
  -- Get post info
  SELECT user_id, title INTO post_author_id, post_title FROM posts WHERE id = NEW.post_id;
  -- Get commenter name
  SELECT company_name INTO commenter_name FROM profiles WHERE user_id = NEW.user_id;
  
  -- Notify post author (if not self)
  IF post_author_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, body, link, actor_id)
    VALUES (
      post_author_id,
      'comment_on_post',
      commenter_name || ' comentou no seu post',
      left(NEW.content, 100),
      '/the-hive/community/post/' || NEW.post_id,
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.on_comment_notify();

-- Function: notify on reaction
CREATE OR REPLACE FUNCTION public.on_reaction_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_author_id uuid;
  post_title text;
  reactor_name text;
BEGIN
  SELECT user_id, title INTO post_author_id, post_title FROM posts WHERE id = NEW.post_id;
  SELECT company_name INTO reactor_name FROM profiles WHERE user_id = NEW.user_id;

  IF post_author_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, body, link, actor_id)
    VALUES (
      post_author_id,
      'reaction_on_post',
      reactor_name || ' reagiu ao seu post',
      NEW.emoji || ' em "' || left(post_title, 60) || '"',
      '/the-hive/community/post/' || NEW.post_id,
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reaction_notify
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.on_reaction_notify();

-- Function: notify all users on announcement (posts in "avisos" category)
CREATE OR REPLACE FUNCTION public.on_announcement_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cat_slug text;
  author_name text;
  u record;
BEGIN
  SELECT slug INTO cat_slug FROM categories WHERE id = NEW.category_id;
  
  IF cat_slug = 'avisos' THEN
    SELECT company_name INTO author_name FROM profiles WHERE user_id = NEW.user_id;
    
    FOR u IN SELECT user_id FROM profiles WHERE user_id != NEW.user_id LOOP
      INSERT INTO notifications (user_id, type, title, body, link, actor_id)
      VALUES (
        u.user_id,
        'announcement',
        '📢 Novo aviso: ' || left(NEW.title, 60),
        left(NEW.content, 100),
        '/the-hive/community/post/' || NEW.id,
        NEW.user_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_announcement_notify
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.on_announcement_notify();
