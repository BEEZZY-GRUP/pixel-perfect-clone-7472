
-- 1) Remove duplicate triggers (keep the trg_ versions, drop the on_ versions)
DROP TRIGGER IF EXISTS on_comment_created ON comments;
DROP TRIGGER IF EXISTS on_comment_notify ON comments;
DROP TRIGGER IF EXISTS on_reaction_notify ON post_reactions;
DROP TRIGGER IF EXISTS on_announcement_notify ON posts;
DROP TRIGGER IF EXISTS on_post_created ON posts;

-- 2) Create a comprehensive badge check function
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _xp integer;
  _level integer;
  _post_count integer;
  _comment_count integer;
  _reaction_received integer;
  _comments_received integer;
  _distinct_categories integer;
  _missions_completed integer;
  _badge_count integer;
  _confessionario_count integer;
  _max_comments_on_post integer;
BEGIN
  SELECT xp, level INTO _xp, _level FROM profiles WHERE user_id = _user_id;
  SELECT count(*) INTO _post_count FROM posts WHERE user_id = _user_id;
  SELECT count(*) INTO _comment_count FROM comments WHERE user_id = _user_id;
  SELECT count(*) INTO _reaction_received FROM post_reactions pr JOIN posts p ON pr.post_id = p.id WHERE p.user_id = _user_id AND pr.user_id != _user_id;
  SELECT count(*) INTO _comments_received FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = _user_id AND c.user_id != _user_id;
  SELECT count(DISTINCT category_id) INTO _distinct_categories FROM posts WHERE user_id = _user_id;
  SELECT count(*) INTO _missions_completed FROM user_missions WHERE user_id = _user_id AND completed = true;
  SELECT count(*) INTO _badge_count FROM user_badges WHERE user_id = _user_id;
  SELECT count(*) INTO _confessionario_count FROM posts p JOIN categories c ON p.category_id = c.id WHERE p.user_id = _user_id AND c.slug = 'confessionario';
  SELECT COALESCE(max(cnt), 0) INTO _max_comments_on_post FROM (
    SELECT count(*) as cnt FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = _user_id GROUP BY c.post_id
  ) sub;

  -- XP milestones
  IF _xp >= 1000 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'b27e5c75-cab4-4873-9326-1d1e7e678cc5' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'b27e5c75-cab4-4873-9326-1d1e7e678cc5');
  END IF;
  IF _xp >= 5000 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '9e3e78aa-da0f-4a47-8771-5f01eacc8c44' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '9e3e78aa-da0f-4a47-8771-5f01eacc8c44');
  END IF;
  IF _xp >= 10000 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '0953ebeb-328a-4cc8-b123-dcfb7c2dcee8' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '0953ebeb-328a-4cc8-b123-dcfb7c2dcee8');
  END IF;

  -- Level milestones
  IF _level >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '1c93dab1-b997-4f42-b1e0-7ccdec9163a1' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '1c93dab1-b997-4f42-b1e0-7ccdec9163a1');
  END IF;
  IF _level >= 20 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '1462136d-497b-4655-b22d-f647d5edeea3' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '1462136d-497b-4655-b22d-f647d5edeea3');
  END IF;

  -- Post milestones: Networker(5), Executor(10), Prolífico(25), Escritor Nato(50)
  IF _post_count >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '8d5871fd-ebfd-44d1-99fc-eaf4959fb1c3' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '8d5871fd-ebfd-44d1-99fc-eaf4959fb1c3');
  END IF;
  IF _post_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'a5eb4c5a-9a39-461c-9ecf-7514e52259ec' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'a5eb4c5a-9a39-461c-9ecf-7514e52259ec');
  END IF;
  IF _post_count >= 25 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'cbd920e7-6847-4575-98c0-d0f4fdf45adc' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'cbd920e7-6847-4575-98c0-d0f4fdf45adc');
  END IF;
  IF _post_count >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'a46e3da0-be75-4c37-bdea-f92b850c26bf' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'a46e3da0-be75-4c37-bdea-f92b850c26bf');
  END IF;

  -- Comment milestones: Comentarista(10), Comunicador(50), Voz Ativa(100)
  IF _comment_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'b6694009-9eaf-481a-b060-7a35e97b9f2e' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'b6694009-9eaf-481a-b060-7a35e97b9f2e');
  END IF;
  IF _comment_count >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '6da477cf-6c11-4885-b14f-0c972d7f6b22' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '6da477cf-6c11-4885-b14f-0c972d7f6b22');
  END IF;
  IF _comment_count >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'f2a22592-2e30-459b-a63f-a97f71727114' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'f2a22592-2e30-459b-a63f-a97f71727114');
  END IF;

  -- Comments received: Influencer(50)
  IF _comments_received >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '7a82141c-b30e-4770-b623-372cab48fe05' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '7a82141c-b30e-4770-b623-372cab48fe05');
  END IF;

  -- Reactions received: Popular(100)
  IF _reaction_received >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'a18753ac-04b9-4eef-aa20-af73744d33d1' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'a18753ac-04b9-4eef-aa20-af73744d33d1');
  END IF;

  -- Viral: single post 20+ reactions
  IF EXISTS (SELECT 1 FROM post_reactions pr JOIN posts p ON pr.post_id = p.id WHERE p.user_id = _user_id GROUP BY pr.post_id HAVING count(*) >= 20) THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '104158d4-61a0-4416-bfe0-ba1d9e4d3387' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '104158d4-61a0-4416-bfe0-ba1d9e4d3387');
  END IF;

  -- Inspirador: 25 comments on single post
  IF _max_comments_on_post >= 25 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '851c433e-4582-47e5-8ed1-d96b247cedba' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '851c433e-4582-47e5-8ed1-d96b247cedba');
  END IF;

  -- Multitarefa: 5 categories
  IF _distinct_categories >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '65f38978-f395-444a-9315-e1e1221d9755' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '65f38978-f395-444a-9315-e1e1221d9755');
  END IF;

  -- Confidente: 3 in confessionário
  IF _confessionario_count >= 3 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '04f3c236-2f8a-481f-9fe4-ef6c511833e2' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '04f3c236-2f8a-481f-9fe4-ef6c511833e2');
  END IF;

  -- Missions: Conquistador(10), Diamante(25)
  IF _missions_completed >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'e58734b9-1bb8-4b88-9843-e5e16891f1a6' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'e58734b9-1bb8-4b88-9843-e5e16891f1a6');
  END IF;
  IF _missions_completed >= 25 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '41da428e-cf18-4511-ad66-ee3c1e08d640' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '41da428e-cf18-4511-ad66-ee3c1e08d640');
  END IF;

  -- Badge collection: Colecionador(10), Lenda Viva(20)
  SELECT count(*) INTO _badge_count FROM user_badges WHERE user_id = _user_id;
  IF _badge_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'f54ac545-8ca9-41cb-b8a8-428a0628e6e6' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'f54ac545-8ca9-41cb-b8a8-428a0628e6e6');
  END IF;
  IF _badge_count >= 20 THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '858370a9-d30d-474b-b8c9-ccff01c19071' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '858370a9-d30d-474b-b8c9-ccff01c19071');
  END IF;

  -- Time-based: Madrugador, Noturno
  IF EXISTS (SELECT 1 FROM posts WHERE user_id = _user_id AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo') < 7) THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'b9a8a345-2179-477c-aba5-2da9da1ca944' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'b9a8a345-2179-477c-aba5-2da9da1ca944');
  END IF;
  IF EXISTS (SELECT 1 FROM posts WHERE user_id = _user_id AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo') >= 0 AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo') < 5) THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '83a636b8-a398-4f5f-92f2-31ffaa381a03' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '83a636b8-a398-4f5f-92f2-31ffaa381a03');
  END IF;

  -- Tenure: Veterano(3m), Fiel Escudeiro(6m), Oráculo(1y)
  IF (SELECT created_at FROM profiles WHERE user_id = _user_id) <= now() - interval '3 months' THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '9fa78674-8fcb-46c3-bb43-4bb192d65c09' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '9fa78674-8fcb-46c3-bb43-4bb192d65c09');
  END IF;
  IF (SELECT created_at FROM profiles WHERE user_id = _user_id) <= now() - interval '6 months' THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'ef4a1c32-1f2f-4127-90f6-47b3a64779ac' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'ef4a1c32-1f2f-4127-90f6-47b3a64779ac');
  END IF;
  IF (SELECT created_at FROM profiles WHERE user_id = _user_id) <= now() - interval '1 year' THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, 'a283de71-5e00-4845-91ed-9eb8dbb0d25c' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = 'a283de71-5e00-4845-91ed-9eb8dbb0d25c');
  END IF;

  -- Top 10 ranking
  IF EXISTS (
    SELECT 1 FROM (SELECT user_id, ROW_NUMBER() OVER (ORDER BY xp DESC) as rank FROM profiles) ranked WHERE ranked.user_id = _user_id AND ranked.rank <= 10
  ) THEN
    INSERT INTO user_badges (user_id, badge_id) SELECT _user_id, '2a654f90-5b64-4e4c-bd36-61b9699cfd16' WHERE NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = '2a654f90-5b64-4e4c-bd36-61b9699cfd16');
  END IF;
END;
$$;

-- 3) Badge XP reward trigger
CREATE OR REPLACE FUNCTION public.on_badge_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _xp_reward integer;
BEGIN
  SELECT xp_reward INTO _xp_reward FROM badges WHERE id = NEW.badge_id;
  IF _xp_reward > 0 THEN
    PERFORM add_xp(NEW.user_id, _xp_reward, 'Insígnia desbloqueada: ' || (SELECT name FROM badges WHERE id = NEW.badge_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_badge_earned ON user_badges;
CREATE TRIGGER trg_badge_earned
  AFTER INSERT ON user_badges
  FOR EACH ROW
  EXECUTE FUNCTION on_badge_earned();

-- 4) Updated on_post_created
CREATE OR REPLACE FUNCTION public.on_post_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM add_xp(NEW.user_id, 20, 'Criou uma publicação');
  
  IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_id = '1b6f8285-74dd-4b4f-9cf7-5e0b0d0853d0') THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, '1b6f8285-74dd-4b4f-9cf7-5e0b0d0853d0');
  END IF;

  INSERT INTO user_missions (user_id, mission_id)
  SELECT NEW.user_id, m.id FROM missions m
  WHERE m.active = true AND m.target_action IN ('post','post_in_cases','post_in_drops','post_in_network','post_in_desafios','post_in_duvidas')
    AND NOT EXISTS (SELECT 1 FROM user_missions um WHERE um.user_id = NEW.user_id AND um.mission_id = m.id)
  ON CONFLICT DO NOTHING;

  UPDATE user_missions 
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN true ELSE false END,
      completed_at = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN now() ELSE NULL END
  WHERE user_id = NEW.user_id AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE target_action = 'post' AND active = true);

  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

-- 5) Updated on_comment_created
CREATE OR REPLACE FUNCTION public.on_comment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _post_author uuid;
BEGIN
  SELECT user_id INTO _post_author FROM posts WHERE id = NEW.post_id;
  
  PERFORM add_xp(NEW.user_id, 10, 'Comentou em uma publicação');
  PERFORM add_xp(_post_author, 5, 'Recebeu um comentário');

  INSERT INTO user_missions (user_id, mission_id)
  SELECT NEW.user_id, m.id FROM missions m
  WHERE m.active = true AND m.target_action = 'comment'
    AND NOT EXISTS (SELECT 1 FROM user_missions um WHERE um.user_id = NEW.user_id AND um.mission_id = m.id)
  ON CONFLICT DO NOTHING;

  UPDATE user_missions 
  SET progress = progress + 1,
      completed = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN true ELSE false END,
      completed_at = CASE WHEN progress + 1 >= (SELECT target_count FROM missions WHERE id = mission_id) THEN now() ELSE NULL END
  WHERE user_id = NEW.user_id AND completed = false
    AND mission_id IN (SELECT id FROM missions WHERE target_action = 'comment' AND active = true);

  PERFORM check_and_award_badges(NEW.user_id);
  IF _post_author IS DISTINCT FROM NEW.user_id THEN
    PERFORM check_and_award_badges(_post_author);
  END IF;
  RETURN NEW;
END;
$$;

-- 6) Reaction badge check trigger
CREATE OR REPLACE FUNCTION public.on_reaction_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM check_and_award_badges((SELECT user_id FROM posts WHERE id = NEW.post_id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reaction_badge_check ON post_reactions;
CREATE TRIGGER trg_reaction_badge_check
  AFTER INSERT ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION on_reaction_created();
