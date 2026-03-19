
-- Add XP/points to profiles
ALTER TABLE public.profiles ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN level INTEGER NOT NULL DEFAULT 1;

-- Badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '🏅',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by authenticated" ON public.badges FOR SELECT TO authenticated USING (true);

-- Seed badges
INSERT INTO public.badges (name, description, emoji, xp_reward) VALUES
  ('Primeiro Post', 'Criou sua primeira publicação', '✍️', 50),
  ('Comentarista', 'Fez 10 comentários', '💬', 100),
  ('Influencer', 'Recebeu 50 comentários em seus posts', '🌟', 200),
  ('Veterano', 'Membro há mais de 3 meses', '🎖️', 150),
  ('Networker', 'Publicou 5 vezes em Network', '🤝', 100),
  ('Executor', 'Publicou 10 vezes em Execução', '🛠', 150),
  ('Case Master', 'Compartilhou 5 estudos de caso', '🧠', 200),
  ('Conquistador', 'Completou 10 missões', '🏆', 300),
  ('Top 10', 'Entrou no Top 10 do ranking', '🔥', 250),
  ('Confidente', 'Publicou 3 vezes no Confessionário', '🕵️', 100),
  ('Ouro Puro', 'Compartilhou 10 Drops de Ouro', '⚡', 150),
  ('Desafiante', 'Completou 5 desafios', '💪', 200);

-- User badges (many-to-many)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by authenticated" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert user badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Missions table
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '🎯',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  mission_type TEXT NOT NULL DEFAULT 'weekly',
  target_count INTEGER NOT NULL DEFAULT 1,
  target_action TEXT NOT NULL DEFAULT 'post',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Missions viewable by authenticated" ON public.missions FOR SELECT TO authenticated USING (true);

-- Seed missions
INSERT INTO public.missions (title, description, emoji, xp_reward, mission_type, target_count, target_action) VALUES
  ('Primeira Publicação', 'Crie sua primeira publicação na comunidade', '✍️', 50, 'onetime', 1, 'post'),
  ('Voz Ativa', 'Faça 5 comentários esta semana', '💬', 30, 'weekly', 5, 'comment'),
  ('Criador de Conteúdo', 'Publique 3 posts esta semana', '📝', 50, 'weekly', 3, 'post'),
  ('Compartilhe um Case', 'Publique um estudo de caso real', '🧠', 80, 'onetime', 1, 'post_in_cases'),
  ('Drop de Ouro', 'Compartilhe 3 insights rápidos', '⚡', 40, 'weekly', 3, 'post_in_drops'),
  ('Desafiante Semanal', 'Complete o desafio da semana', '🔥', 60, 'weekly', 1, 'post_in_desafios'),
  ('Networker Ativo', 'Publique 2 vezes em Network', '🤝', 40, 'weekly', 2, 'post_in_network'),
  ('Engajamento Total', 'Comente em 10 posts diferentes', '🏅', 100, 'monthly', 10, 'comment'),
  ('Produtor Mensal', 'Publique 10 posts no mês', '🚀', 150, 'monthly', 10, 'post'),
  ('Mentor', 'Responda 20 dúvidas', '🎓', 200, 'onetime', 20, 'post_in_duvidas');

-- User missions progress
CREATE TABLE public.user_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User missions viewable by authenticated" ON public.user_missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own missions" ON public.user_missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.user_missions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- XP history for audit
CREATE TABLE public.xp_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "XP history viewable by own user" ON public.xp_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp" ON public.xp_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Function to add XP and level up
CREATE OR REPLACE FUNCTION public.add_xp(_user_id uuid, _amount integer, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp integer;
  new_level integer;
BEGIN
  UPDATE profiles SET xp = xp + _amount WHERE user_id = _user_id RETURNING xp INTO new_xp;
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  new_level := GREATEST(1, floor(sqrt(new_xp::numeric / 100)) + 1);
  UPDATE profiles SET level = new_level WHERE user_id = _user_id;
  INSERT INTO xp_history (user_id, amount, reason) VALUES (_user_id, _amount, _reason);
END;
$$;
