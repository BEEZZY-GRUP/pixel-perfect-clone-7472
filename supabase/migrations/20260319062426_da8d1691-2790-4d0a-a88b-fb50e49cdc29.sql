
-- Create a SECURITY DEFINER function for inserting notifications (bypasses RLS)
CREATE OR REPLACE FUNCTION public.insert_notification(
  _user_id uuid,
  _type text,
  _title text,
  _body text DEFAULT NULL,
  _link text DEFAULT NULL,
  _actor_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link, actor_id)
  VALUES (_user_id, _type, _title, _body, _link, _actor_id);
END;
$$;

-- Update on_comment_notify to use the new function
CREATE OR REPLACE FUNCTION public.on_comment_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id uuid;
  post_title text;
  commenter_name text;
BEGIN
  SELECT user_id, title INTO post_author_id, post_title FROM posts WHERE id = NEW.post_id;
  SELECT company_name INTO commenter_name FROM profiles WHERE user_id = NEW.user_id;
  
  IF post_author_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM insert_notification(
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

-- Update on_reaction_notify to use the new function
CREATE OR REPLACE FUNCTION public.on_reaction_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id uuid;
  post_title text;
  reactor_name text;
BEGIN
  SELECT user_id, title INTO post_author_id, post_title FROM posts WHERE id = NEW.post_id;
  SELECT company_name INTO reactor_name FROM profiles WHERE user_id = NEW.user_id;

  IF post_author_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM insert_notification(
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

-- Update on_announcement_notify to use the new function
CREATE OR REPLACE FUNCTION public.on_announcement_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      PERFORM insert_notification(
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

-- Recreate the triggers (they may not exist yet since db-triggers showed none)
DROP TRIGGER IF EXISTS trg_comment_notify ON comments;
CREATE TRIGGER trg_comment_notify AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION on_comment_notify();

DROP TRIGGER IF EXISTS trg_reaction_notify ON post_reactions;
CREATE TRIGGER trg_reaction_notify AFTER INSERT ON post_reactions FOR EACH ROW EXECUTE FUNCTION on_reaction_notify();

DROP TRIGGER IF EXISTS trg_announcement_notify ON posts;
CREATE TRIGGER trg_announcement_notify AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION on_announcement_notify();
