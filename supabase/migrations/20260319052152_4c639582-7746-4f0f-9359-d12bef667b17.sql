-- 1. Award XP on new post
CREATE OR REPLACE FUNCTION public.on_post_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award 20 XP per post
  PERFORM add_xp(NEW.user_id, 20, 'Criou uma publicação');
  
  -- Auto-award "Primeiro Post" badge
  IF NOT EXISTS (
    SELECT 1 FROM user_badges ub WHERE ub.user_id = NEW.user_id AND ub.badge_id = '1b6f8285-74dd-4b4f-9cf7-5e0b0d0853d0'
  ) THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, '1b6f8285-74dd-4b4f-9cf7-5e0b0d0853d0');
  END IF;

  -- "Comentarista" style badges based on post count
  -- Networker: 5 posts
  IF (SELECT count(*) FROM posts WHERE user_id = NEW.user_id) >= 5
     AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_id = '8d5871fd-ebfd-44d1-99fc-eaf4959fb1c3')
  THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, '8d5871fd-ebfd-44d1-99fc-eaf4959fb1c3');
  END IF;

  -- Executor: 10 posts
  IF (SELECT count(*) FROM posts WHERE user_id = NEW.user_id) >= 10
     AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_id = 'a5eb4c5a-9a39-461c-9ecf-7514e52259ec')
  THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'a5eb4c5a-9a39-461c-9ecf-7514e52259ec');
  END IF;

  -- Update mission progress for 'post' actions
  UPDATE user_missions 
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN true ELSE false END,
      completed_at = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN now() ELSE NULL END
  WHERE user_id = NEW.user_id 
    AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE target_action = 'post' AND active = true);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION on_post_created();

-- 2. Award XP on new comment
CREATE OR REPLACE FUNCTION public.on_comment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Award 10 XP per comment
  PERFORM add_xp(NEW.user_id, 10, 'Comentou em uma publicação');

  -- Comentarista badge: 10 comments
  IF (SELECT count(*) FROM comments WHERE user_id = NEW.user_id) >= 10
     AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_id = 'b6694009-9eaf-481a-b060-7a35e97b9f2e')
  THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'b6694009-9eaf-481a-b060-7a35e97b9f2e');
  END IF;

  -- Award 5 XP to the post author (engagement reward)
  PERFORM add_xp(
    (SELECT user_id FROM posts WHERE id = NEW.post_id),
    5,
    'Recebeu um comentário'
  );

  -- Influencer badge: 50 comments received
  IF (SELECT count(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) AND c.user_id != p.user_id) >= 50
     AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) AND badge_id = '7a82141c-b30e-4770-b623-372cab48fe05')
  THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES ((SELECT user_id FROM posts WHERE id = NEW.post_id), '7a82141c-b30e-4770-b623-372cab48fe05');
  END IF;

  -- Update mission progress for 'comment' actions
  UPDATE user_missions 
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN true ELSE false END,
      completed_at = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN now() ELSE NULL END
  WHERE user_id = NEW.user_id 
    AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE target_action = 'comment' AND active = true);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION on_comment_created();